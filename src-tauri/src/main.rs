#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod proxy;

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};

use serde_json::{json, Value};
use tauri::Manager;

fn config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path().app_config_dir().map_err(|e| e.to_string())
}

fn legacy_config() -> Option<Value> {
    let dir = dirs::config_dir()?;
    let file = dir.join("keues-monitors").join("config.json");
    if file.exists() {
        let text = fs::read_to_string(file).ok()?;
        let root: Value = serde_json::from_str(&text).ok()?;
        root.get("config").cloned()
    } else {
        None
    }
}

fn write_config(file: &Path, config: &Value) -> Result<(), String> {
    if let Some(parent) = file.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let text = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(file, text).map_err(|e| e.to_string())
}

fn read_existing(file: &Path) -> Result<Value, String> {
    if file.exists() {
        let text = fs::read_to_string(file).map_err(|e| e.to_string())?;
        if text.trim().is_empty() {
            return Ok(Value::Null);
        }
        serde_json::from_str(&text).map_err(|e| e.to_string())
    } else {
        Ok(Value::Null)
    }
}

fn ensure_device_id(mut config: Value) -> (Value, bool) {
    let mut changed = false;
    if let Some(obj) = config.as_object_mut() {
        let has_valid = obj
            .get("deviceId")
            .and_then(|v| v.as_str())
            .map(|s| uuid::Uuid::parse_str(s).is_ok())
            .unwrap_or(false);
        if !has_valid {
            obj.insert(
                "deviceId".into(),
                Value::String(uuid::Uuid::new_v4().to_string()),
            );
            changed = true;
        }
    }
    (config, changed)
}

fn merge_json(mut base: Value, incoming: Value) -> Value {
    if let (Some(base_obj), Some(inc_obj)) = (base.as_object_mut(), incoming.as_object()) {
        for (k, v) in inc_obj {
            base_obj.insert(k.clone(), v.clone());
        }
        base
    } else {
        incoming
    }
}

#[tauri::command]
fn load_config(app: tauri::AppHandle) -> Result<Value, String> {
    let dir = config_dir(&app)?;
    let file = dir.join("config.json");

    let mut config = read_existing(&file)?;

    if config.is_null() {
        if let Some(legacy) = legacy_config() {
            config = legacy;
        }
    }

    let (config, changed) = ensure_device_id(config);
    if changed {
        write_config(&file, &config)?;
    }

    Ok(json!({ "success": true, "config": config }))
}

#[tauri::command]
fn save_config(app: tauri::AppHandle, config: Value) -> Result<Value, String> {
    let dir = config_dir(&app)?;
    let file = dir.join("config.json");

    let existing = read_existing(&file)?;
    let (existing, _) = ensure_device_id(existing);
    let device_id = existing.get("deviceId").cloned().unwrap_or(Value::Null);

    let mut saved = merge_json(existing, config);
    if let Some(obj) = saved.as_object_mut() {
        obj.insert("deviceId".into(), device_id);
    }

    write_config(&file, &saved)?;

    Ok(json!({ "success": true, "config": saved }))
}

#[tauri::command]
fn get_proxy_base(state: tauri::State<'_, Arc<proxy::ProxyState>>) -> Result<String, String> {
    state
        .base
        .get()
        .cloned()
        .ok_or_else(|| "proxy not started".to_string())
}

#[tauri::command]
fn set_proxy_target(
    state: tauri::State<'_, Arc<proxy::ProxyState>>,
    url: String,
) -> Result<(), String> {
    let mut trimmed = url.trim().to_string();

    if !trimmed.is_empty()
        && !trimmed.starts_with("http://")
        && !trimmed.starts_with("https://")
        && !trimmed.starts_with("ws://")
        && !trimmed.starts_with("wss://")
    {
        trimmed = format!("http://{trimmed}");
    }

    trimmed = trimmed.trim_end_matches('/').to_string();

    if trimmed.is_empty() {
        *state.target.lock().unwrap() = None;
    } else {
        *state.target.lock().unwrap() = Some(trimmed);
    }
    Ok(())
}

pub struct TtsState {
    pub process: Mutex<Option<Child>>,
    pub killed: Mutex<bool>,
}

fn tts_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if cfg!(debug_assertions) {
        Ok(Path::new(env!("CARGO_MANIFEST_DIR")).join("../resources/tts"))
    } else {
        app.path()
            .resource_dir()
            .map(|d| d.join("tts"))
            .map_err(|e| e.to_string())
    }
}

#[derive(serde::Serialize)]
struct TtsVoice {
    id: String,
    name: String,
    model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    speaker: Option<String>,
}

fn voice_lang_label(code: &str) -> String {
    match code {
        "es" => "ES".to_string(),
        "en" => "EN".to_string(),
        other => other.to_uppercase(),
    }
}

fn speaker_label(code: &str, key: &str) -> String {
    match key {
        "M" => format!("{}-Male", voice_lang_label(code)),
        "F" => format!("{}-Female", voice_lang_label(code)),
        _ => format!("{}-{}", voice_lang_label(code), key),
    }
}

fn model_speakers(dir: &Path, model: &str, code: &str) -> Vec<(String, String)> {
    let cfg_path = dir.join(format!("{model}.json"));
    let text = match fs::read_to_string(&cfg_path) {
        Ok(t) => t,
        Err(_) => return vec![],
    };
    let cfg: Value = match serde_json::from_str(&text) {
        Ok(v) => v,
        Err(_) => return vec![],
    };
    let Some(map) = cfg.get("speaker_id_map").and_then(|m| m.as_object()) else {
        return vec![];
    };

    let mut entries: Vec<(&String, &Value)> = map.iter().collect();
    entries.sort_by(|a, b| {
        let av = a.1.as_i64().unwrap_or(0);
        let bv = b.1.as_i64().unwrap_or(0);
        av.cmp(&bv)
    });

    entries
        .into_iter()
        .map(|(key, id)| (id.to_string(), speaker_label(code, key)))
        .collect()
}

fn list_voices_impl(app: &tauri::AppHandle) -> Result<Vec<TtsVoice>, String> {
    let dir = tts_dir(app)?;
    let models_dir = dir.join("models");

    let mut files: Vec<String> = fs::read_dir(&models_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|f| f.ends_with(".onnx"))
        .filter(|f| f.starts_with("es_") || f.starts_with("en_"))
        .collect();
    files.sort();

    let mut voices = Vec::new();
    for file in files {
        let code = file.split('_').next().unwrap_or("").to_string();
        let speakers = model_speakers(&models_dir, &file, &code);
        if speakers.is_empty() {
            voices.push(TtsVoice {
                id: file.clone(),
                name: voice_lang_label(&code),
                model: file.clone(),
                speaker: None,
            });
        } else {
            for (speaker_id, label) in speakers {
                voices.push(TtsVoice {
                    id: format!("{file}|{speaker_id}"),
                    name: label,
                    model: file.clone(),
                    speaker: Some(speaker_id),
                });
            }
        }
    }

    Ok(voices)
}

#[tauri::command(async)]
fn tts_list_voices(app: tauri::AppHandle) -> Result<Value, String> {
    match list_voices_impl(&app) {
        Ok(voices) => Ok(json!({ "success": true, "voices": voices })),
        Err(e) => Ok(json!({ "success": false, "error": e })),
    }
}

#[tauri::command(async)]
fn tts_speak(
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<TtsState>>,
    text: String,
    voice_id: Option<String>,
    rate: Option<f64>,
) -> Result<Value, String> {
    let voices = list_voices_impl(&app)?;
    let voice_id = voice_id.unwrap_or_else(|| {
        voices
            .first()
            .map(|v| v.id.clone())
            .unwrap_or_default()
    });

    if voice_id.is_empty() {
        return Err("No TTS voice available".to_string());
    }

    let (model_id, speaker) = match voice_id.split_once('|') {
        Some((model, speaker)) => (model.to_string(), Some(speaker.to_string())),
        None => (voice_id, None),
    };

    let rate = rate.unwrap_or(1.0);
    let length_scale = 1.0 / rate.clamp(0.5, 2.0);

    let dir = tts_dir(&app)?;
    let tmp = tempfile::tempdir().map_err(|e| e.to_string())?;
    let out_file = tmp.path().join("out.wav");

    let mut args: Vec<String> = vec![
        "--model".into(),
        dir.join("models")
            .join(&model_id)
            .to_string_lossy()
            .into_owned(),
        "--espeak_data".into(),
        dir.join("espeak-ng-data").to_string_lossy().into_owned(),
        "--output_file".into(),
        out_file.to_string_lossy().into_owned(),
        "--length_scale".into(),
        format!("{length_scale}"),
        "--quiet".into(),
    ];

    if let Some(speaker) = &speaker {
        args.push("--speaker".into());
        args.push(speaker.clone());
    }

    let piper = if cfg!(windows) {
        dir.join("piper-win").join("piper.exe")
    } else {
        dir.join("piper-linux").join("piper")
    };

    let mut cmd = Command::new(&piper);
    cmd.args(&args);
    cmd.stdin(Stdio::piped());
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::null());

    if !cfg!(windows) {
        cmd.env("LD_LIBRARY_PATH", dir.join("piper-linux"));
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("TTS engine failed to start: {e}"))?;

    {
        use std::io::Write;
        let mut stdin = child
            .stdin
            .take()
            .ok_or_else(|| "could not open TTS stdin".to_string())?;
        stdin.write_all(text.as_bytes()).map_err(|e| e.to_string())?;
    }

    *state.killed.lock().unwrap() = false;
    *state.process.lock().unwrap() = Some(child);

    let status = {
        let child = state.process.lock().unwrap().take();
        match child {
            Some(mut child) => child.wait().map_err(|e| e.to_string())?,
            None => return Ok(json!({ "success": true, "wav": [] })),
        }
    };

    let killed = *state.killed.lock().unwrap();

    if !killed && !status.success() {
        return Err(format!("TTS engine exited with code {:?}", status.code()));
    }

    let wav = fs::read(&out_file).unwrap_or_default();

    Ok(json!({ "success": true, "wav": wav }))
}

#[tauri::command]
fn tts_stop(state: tauri::State<'_, Arc<TtsState>>) -> Result<Value, String> {
    *state.killed.lock().unwrap() = true;

    if let Some(child) = state.process.lock().unwrap().as_mut() {
        let _ = child.kill();
    }

    Ok(json!({ "success": true }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let proxy_state = Arc::new(proxy::ProxyState::default());
            tauri::async_runtime::block_on(proxy::start(proxy_state.clone()))?;
            app.manage(proxy_state);

            app.manage(Arc::new(TtsState {
                process: Mutex::new(None),
                killed: Mutex::new(false),
            }));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            get_proxy_base,
            set_proxy_target,
            tts_list_voices,
            tts_speak,
            tts_stop
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

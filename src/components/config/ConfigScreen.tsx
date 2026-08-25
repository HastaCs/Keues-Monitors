import { useEffect, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import {
    Accordion,
    Alert,
    Box,
    Button,
    Checkbox,
    ColorInput,
    FileInput,
    Group,
    NavLink,
    NumberInput,
    Modal,
    Select,
    Stack,
    Tabs,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { IconBellRinging, IconBorderOuter, IconCheck, IconDeviceTv, IconDoorEnter, IconEye, IconHistory, IconLayout, IconPalette, IconPhoto, IconPhotoOff, IconPlayerPlay, IconPlugConnected, IconRefresh, IconServer, IconSpeakerphone, IconTypography, IconVolume } from "@tabler/icons-react";

import Brand from "../Brand";
import VersionBadge from "../VersionBadge";
import UpdatePanel from "./UpdatePanel";
import PresetPicker from "./PresetPicker";
import ThemePreviewModal from "./ThemePreviewModal";
import { COLOR_SWATCHES, getPresetsForFlow } from "./themePresets";
import { getLocations, getFlows } from "../../api/keuesApi";
import { ttsListVoices, ttsSpeak } from "../../api/ttsService";
import { playBeep } from "../../api/soundService";
import { isTauri, saveConfiguration } from "../../api/appBridge";
import { configureTarget } from "../../api/net";

import type { Location, Flow } from "../../types/models";
import type { MonitorConfiguration } from "../../types/config";
import { resolveTheme } from "../../types/theme";
import type { MonitorTheme } from "../../types/theme";
import type { TTSVoice } from "../../types/tts";
import { LAYOUTS_BY_FLOW } from "../monitors/layouts";


interface Props {
    initialConfig?: MonitorConfiguration | null;
    onSaved: (config: MonitorConfiguration) => void;
    onCancel?: () => void;
}


export default function ConfigScreen({ initialConfig, onSaved, onCancel }: Props) {

    const [server, setServer] = useState(initialConfig?.server ?? "");
    const [deviceName, setDeviceName] = useState(initialConfig?.deviceName ?? "");
    const [locations, setLocations] = useState<Location[]>([]);
    const [flows, setFlows] = useState<Flow[]>([]);

    const [locationId, setLocationId] = useState<string | null>(initialConfig?.locationId ?? null);
    const [flowId, setFlowId] = useState<string | null>(initialConfig?.flowId ?? null);
    const [flowTypeSel, setFlowTypeSel] = useState<number | null>(initialConfig?.flowType ?? null);
    const [themeFlowType, setThemeFlowType] = useState<number>(initialConfig?.flowType ?? 0);

    const [buscando, setBuscando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [theme, setTheme] = useState<Record<number, Partial<MonitorTheme>>>(initialConfig?.theme ?? {});
    const [ttsVoices, setTtsVoices] = useState<TTSVoice[]>([]);

    const [activeTab, setActiveTab] = useState<"config" | "apariencia" | "updates">("config");
    const [layoutModalOpen, setLayoutModalOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const isNarrow = useMediaQuery("(max-width: 700px)");
    const navStyles = isNarrow ? { root: { justifyContent: "center", paddingInline: 0 }, body: { display: "none" } } : undefined;

    const resolvedTheme = resolveTheme(themeFlowType, theme[themeFlowType]);
    const voiceValue = ttsVoices.some(v => v.id === resolvedTheme.voiceId)
        ? resolvedTheme.voiceId
        : ttsVoices.find(v => v.model === resolvedTheme.voiceId)?.id ?? resolvedTheme.voiceId;


    function updateTheme(patch: Partial<MonitorTheme>) {
        setTheme(prev => ({
            ...prev,
            [themeFlowType]: { ...prev[themeFlowType], ...patch },
        }));
    }


    async function previewVoice() {
        const prefix = resolvedTheme.voicePrefix?.trim();
        await ttsSpeak(prefix ? `${prefix} 12` : "12", voiceValue);
    }


    function handleImageFile(file: File | null) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            updateTheme({ backgroundImage: reader.result as string });
        };
        reader.readAsDataURL(file);
    }


    useEffect(() => {
        let mounted = true;

        async function cargar() {

            const cfg = initialConfig;
            if (!cfg?.server)
                return;

            setBuscando(true);
            setError(null);

            try {
                await configureTarget(cfg.server);

                const locs = await getLocations(cfg.server);
                if (!mounted) return;
                setLocations(locs);

                if (!cfg.locationId) return;

                const fls = await getFlows(cfg.server, cfg.locationId);
                if (!mounted) return;
                setFlows(fls);

                if (cfg.flowId) {
                    const flow = fls.find(x => x.id === cfg.flowId);
                    if (mounted)
                        setFlowTypeSel(flow?.flowType ?? null);
                }
            }
            catch (e) {
                if (mounted)
                    setError((e as Error).message);
            }
            finally {
                if (mounted)
                    setBuscando(false);
            }
        }

        void cargar();

        return () => { mounted = false; };
    }, [initialConfig]);


    useEffect(() => {
        let mounted = true;

        void ttsListVoices().then(voices => {
            if (mounted) setTtsVoices(voices);
        });

        return () => { mounted = false; };
    }, []);


    async function conectar() {

        if (!server.trim()) return;

        setBuscando(true);
        setError(null);
        setLocations([]);
        setFlows([]);
        setLocationId(null);
        setFlowId(null);

        try {
            await configureTarget(server.trim());

            const data = await getLocations(server.trim());
            setLocations(data);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBuscando(false);
        }
    }


    async function changeLocation(id: string | null) {

        if (!id) return;

        setLocationId(id);
        setFlowId(null);
        setFlowTypeSel(null);
        setFlows([]);

        setBuscando(true);
        setError(null);

        try {
            await configureTarget(server);

            const data = await getFlows(server, id);
            setFlows(data);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBuscando(false);
        }
    }


    function changeFlow(id: string | null) {

        if (!id) return;

        setFlowId(id);
        setError(null);

        const flow = flows.find(x => x.id === id);
        setFlowTypeSel(flow?.flowType ?? null);
    }


    async function persist(): Promise<MonitorConfiguration | null> {

        if (!server.trim() || !locationId || !flowId) return null;

        const location = locations.find(x => x.id === locationId);
        const flow = flows.find(x => x.id === flowId);

        const config: MonitorConfiguration = {
            server: server.trim(),
            deviceName: deviceName.trim(),
            locationId,
            flowId,
            flowType: flowTypeSel,
            deviceId: initialConfig?.deviceId,
            locationName: location?.name,
            flowName: flow?.name,
            theme,
        };

        if (isTauri()) {
            const result = await saveConfiguration(config);

            if (result.success && result.config) {
                return result.config;
            }
        }

        return config;
    }


    async function guardar() {
        const config = await persist();
        if (config) onSaved(config);
    }


    async function guardarApariencia() {
        const config = await persist();
        if (config) onSaved(config);
    }


    const flowTypeLabel: Record<number, string> = {
        0: "TicketMachine — current ticket + history",
        1: "SetFree — free counter",
        2: "ManualCall — manual number",
    };


    const configPanel = (
        <Stack gap="xs">

            <Stack gap={4}>
                <Title order={2} fw={700}>
                    Monitor configuration
                </Title>
                <Text size="sm" c="dimmed">
                    Configure the TV screen for this location
                </Text>
            </Stack>

            <TextInput
                label="Screen name"
                description="Identifies this TV in the system"
                placeholder="Main Room TV"
                leftSection={<IconDeviceTv size={16} />}
                value={deviceName}
                onChange={e => setDeviceName(e.currentTarget.value)}
            />

            <Group align="flex-end" gap="sm">
                <TextInput
                    style={{ flex: 1 }}
                    label="Server"
                    description="Keues API URL"
                    placeholder="http://localhost:5125"
                    leftSection={<IconServer size={16} />}
                    value={server}
                    onChange={e => setServer(e.currentTarget.value)}
                    onKeyDown={e => { if (e.key === "Enter") void conectar(); }}
                />
                <Button onClick={conectar} loading={buscando} mb={1}>
                    Connect
                </Button>
            </Group>

            <Select
                label="Location"
                placeholder="Select a location"
                data={locations.map(x => ({ value: x.id, label: x.name }))}
                value={locationId}
                onChange={changeLocation}
                disabled={locations.length === 0 || buscando}
            />

            <Select
                label="Flow"
                placeholder="Select a flow"
                data={flows.map(x => ({ value: x.id, label: x.name }))}
                value={flowId}
                onChange={changeFlow}
                disabled={flows.length === 0 || buscando}
            />

            {flowTypeSel != null && (
                <Text size="xs" c="dimmed" ta="center">
                    Monitor type: {flowTypeLabel[flowTypeSel] ?? "Unknown"}
                </Text>
            )}

            {error && (
                <Alert color="red" title="Connection error">
                    {error}
                </Alert>
            )}

            <Group mt="xs" justify="flex-end" gap="sm">
                {onCancel && (
                    <Button variant="default" onClick={onCancel}>
                        Back
                    </Button>
                )}
                <Button
                    onClick={guardar}
                    disabled={!server.trim() || !locationId || !flowId || buscando}
                >
                    Save
                </Button>
            </Group>

        </Stack>
    );


    const layouts = LAYOUTS_BY_FLOW[themeFlowType] ?? [];
    const hasLayouts = layouts.length > 1;
    const currentLayoutId = resolvedTheme.layout ?? layouts[0]?.id;
    const currentLayoutLabel = layouts.find(l => l.id === currentLayoutId)?.label ?? layouts[0]?.label;

    const appearancePanel = (
        <Stack gap="sm">

            <Group justify="space-between" align="flex-end">
                <Stack gap={4}>
                    <Title order={3} fw={700}>
                        Appearance
                    </Title>
                    <Text size="sm" c="dimmed">
                        Customize the colors of each panel
                    </Text>
                </Stack>
                <Button
                    variant="light"
                    leftSection={<IconEye size={16} />}
                    onClick={() => setPreviewOpen(true)}
                >
                    Preview
                </Button>
            </Group>

            <Tabs value={String(themeFlowType)} onChange={v => setThemeFlowType(Number(v))} variant="pills" color="blue" radius="lg">
                <Tabs.List grow p={4} mb="xs" style={{ backgroundColor: "var(--mantine-color-blue-0)", borderRadius: "var(--mantine-radius-lg)" }}>
                    <Tabs.Tab value="0" leftSection={<IconDeviceTv size={16} />}>TicketMachine</Tabs.Tab>
                    <Tabs.Tab value="1" leftSection={<IconDoorEnter size={16} />}>SetFree</Tabs.Tab>
                    <Tabs.Tab value="2" leftSection={<IconSpeakerphone size={16} />}>ManualCall</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value={String(themeFlowType)}>
                    <Stack gap="md">

                        <Stack gap={6}>
                            <Text size="sm" fw={500}>
                                Theme presets
                            </Text>
                            <PresetPicker
                                presets={getPresetsForFlow(themeFlowType)}
                                onSelect={preset => updateTheme(preset.colors)}
                            />
                        </Stack>

                        <Accordion
                            multiple
                            defaultValue={["colors"]}
                            variant="separated"
                            radius="md"
                            styles={{ item: { backgroundColor: "var(--mantine-color-white)" } }}
                        >
                            <Accordion.Item value="colors">
                                <Accordion.Control icon={<IconPalette size={18} />}>
                                    Colors
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="sm">
                                        <Group grow>
                                            <ColorInput
                                                label="Card background"
                                                swatches={COLOR_SWATCHES}
                                                value={resolvedTheme.cardBackground}
                                                onChange={v => updateTheme({ cardBackground: v })}
                                            />
                                            <ColorInput
                                                label="Text color"
                                                swatches={COLOR_SWATCHES}
                                                value={resolvedTheme.textColor}
                                                onChange={v => updateTheme({ textColor: v })}
                                            />
                                            <ColorInput
                                                label="Secondary text"
                                                swatches={COLOR_SWATCHES}
                                                value={resolvedTheme.secondaryTextColor}
                                                onChange={v => updateTheme({ secondaryTextColor: v })}
                                            />
                                        </Group>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>

                            <Accordion.Item value="background">
                                <Accordion.Control icon={<IconPhoto size={18} />}>
                                    Background
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="sm">
                                        <Group grow align="flex-end" gap="sm">
                                            <ColorInput
                                                label="Background color"
                                                swatches={COLOR_SWATCHES}
                                                value={resolvedTheme.background}
                                                onChange={v => updateTheme({ background: v })}
                                            />
                                            <FileInput
                                                style={{ flex: 1 }}
                                                label="Background image"
                                                description="Upload a local image"
                                                placeholder="Select image"
                                                accept="image/*"
                                                onChange={handleImageFile}
                                            />
                                            {resolvedTheme.backgroundImage && (
                                                <Button
                                                    variant="light"
                                                    color="red"
                                                    leftSection={<IconPhotoOff size={16} />}
                                                    mb={1}
                                                    onClick={() => updateTheme({ backgroundImage: undefined })}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </Group>

                                        {resolvedTheme.backgroundImage && (
                                            <Box
                                                style={{
                                                    height: 120,
                                                    borderRadius: 8,
                                                    backgroundImage: `url(${resolvedTheme.backgroundImage})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                    border: "1px solid #e5e7eb",
                                                }}
                                            />
                                        )}
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>

                            <Accordion.Item value="titles">
                                <Accordion.Control icon={<IconTypography size={18} />}>
                                    Titles & text
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="sm">
                                        <Group grow align="flex-end">
                                            <TextInput
                                                label="Main title"
                                                placeholder="Current ticket"
                                                value={resolvedTheme.labelTitle}
                                                onChange={e => updateTheme({ labelTitle: e.currentTarget.value })}
                                            />
                                            <ColorInput
                                                label="Main title color"
                                                swatches={COLOR_SWATCHES}
                                                value={resolvedTheme.labelTitleColor}
                                                onChange={v => updateTheme({ labelTitleColor: v })}
                                            />
                                            <NumberInput
                                                label="Main title size"
                                                description="Pixels"
                                                min={8}
                                                max={300}
                                                step={1}
                                                value={resolvedTheme.labelTitleSize ?? ""}
                                                onChange={v => updateTheme({ labelTitleSize: typeof v === "number" ? v : undefined })}
                                            />
                                        </Group>

                                        {themeFlowType === 1 && (
                                            <TextInput
                                                label="Text below the number"
                                                placeholder="Please go to the counter"
                                                value={resolvedTheme.labelFooter}
                                                onChange={e => updateTheme({ labelFooter: e.currentTarget.value })}
                                            />
                                        )}

                                        {themeFlowType === 0 && (
                                            <Group grow align="flex-end">
                                                <Checkbox
                                                    label="Show clock"
                                                    description="Time and date in the corner"
                                                    checked={resolvedTheme.showClock ?? false}
                                                    onChange={e => updateTheme({ showClock: e.currentTarget.checked })}
                                                />
                                                <ColorInput
                                                    label="Clock text color"
                                                    swatches={COLOR_SWATCHES}
                                                    value={resolvedTheme.clockTextColor ?? resolvedTheme.textColor}
                                                    onChange={v => updateTheme({ clockTextColor: v })}
                                                />
                                            </Group>
                                        )}
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>

                            {hasLayouts && (
                                <Accordion.Item value="layout">
                                    <Accordion.Control icon={<IconLayout size={18} />}>
                                        Layout
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Button
                                            variant="default"
                                            fullWidth
                                            leftSection={<IconLayout size={16} />}
                                            onClick={() => setLayoutModalOpen(true)}
                                        >
                                            {currentLayoutLabel}
                                        </Button>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            )}

                            <Accordion.Item value="border">
                                <Accordion.Control icon={<IconBorderOuter size={18} />}>
                                    Border
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Group grow align="flex-end">
                                        <ColorInput
                                            label="Border color"
                                            swatches={COLOR_SWATCHES}
                                            value={resolvedTheme.borderColor}
                                            onChange={v => updateTheme({ borderColor: v })}
                                        />
                                        <NumberInput
                                            label="Border width"
                                            description="Width in pixels"
                                            min={0}
                                            max={40}
                                            step={1}
                                            value={resolvedTheme.borderWidth}
                                            onChange={v => updateTheme({ borderWidth: typeof v === "number" ? v : 0 })}
                                        />
                                    </Group>
                                </Accordion.Panel>
                            </Accordion.Item>

                            <Accordion.Item value="sound">
                                <Accordion.Control icon={<IconBellRinging size={18} />}>
                                    Alert sound
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Group grow align="flex-end">
                                        <Checkbox
                                            label="Play beep on new ticket"
                                            description="Short beep when a ticket is called (before the voice, if enabled)"
                                            checked={resolvedTheme.beepEnabled ?? false}
                                            onChange={e => updateTheme({ beepEnabled: e.currentTarget.checked })}
                                        />
                                        <Button
                                            size="compact-sm"
                                            variant="light"
                                            leftSection={<IconPlayerPlay size={14} />}
                                            onClick={() => void playBeep()}
                                            disabled={!(resolvedTheme.beepEnabled ?? false)}
                                            w="fit-content"
                                        >
                                            Preview
                                        </Button>
                                    </Group>
                                </Accordion.Panel>
                            </Accordion.Item>

                            {themeFlowType === 1 && (
                                <Accordion.Item value="voice">
                                    <Accordion.Control icon={<IconVolume size={18} />}>
                                        Voice
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Stack gap="xs">
                                            <Group grow align="flex-end">
                                                <Checkbox
                                                    label="Activate voice"
                                                    checked={resolvedTheme.voiceEnabled ?? false}
                                                    onChange={e => updateTheme({ voiceEnabled: e.currentTarget.checked })}
                                                />
                                                <Select
                                                    label="Voice"
                                                    data={ttsVoices.map(v => ({ value: v.id, label: v.name }))}
                                                    value={voiceValue}
                                                    onChange={v => updateTheme({ voiceId: v ?? undefined })}
                                                    searchable
                                                    disabled={ttsVoices.length === 0 || !(resolvedTheme.voiceEnabled ?? false)}
                                                />
                                                <TextInput
                                                    label="Text before ticket"
                                                    placeholder="Please go to the counter"
                                                    value={resolvedTheme.voicePrefix ?? ""}
                                                    onChange={e => updateTheme({ voicePrefix: e.currentTarget.value })}
                                                    disabled={!(resolvedTheme.voiceEnabled ?? false)}
                                                />
                                            </Group>
                                            <Button
                                                size="compact-sm"
                                                variant="light"
                                                leftSection={<IconPlayerPlay size={14} />}
                                                onClick={() => void previewVoice()}
                                                disabled={ttsVoices.length === 0 || !(resolvedTheme.voiceEnabled ?? false)}
                                                w="fit-content"
                                            >
                                                Preview
                                            </Button>
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            )}

                            <Accordion.Item value="history">
                                <Accordion.Control icon={<IconHistory size={18} />}>
                                    History
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="sm">
                                        {(themeFlowType === 1 || themeFlowType === 2) && (
                                            <Checkbox
                                                label="Show recent calls panel"
                                                checked={resolvedTheme.showHistory}
                                                onChange={e => updateTheme({ showHistory: e.currentTarget.checked })}
                                            />
                                        )}

                                        <fieldset disabled={!resolvedTheme.showHistory} style={{ border: "none", padding: 0, margin: 0, opacity: resolvedTheme.showHistory ? 1 : 0.5 }}>
                                            <Stack gap="sm">
                                                <Group grow>
                                                    <ColorInput
                                                        label="History panel background"
                                                        swatches={COLOR_SWATCHES}
                                                        value={resolvedTheme.historyPanelBackground}
                                                        onChange={v => updateTheme({ historyPanelBackground: v })}
                                                    />
                                                    <ColorInput
                                                        label="History card background"
                                                        swatches={COLOR_SWATCHES}
                                                        value={resolvedTheme.historyCardBackground}
                                                        onChange={v => updateTheme({ historyCardBackground: v })}
                                                    />
                                                </Group>

                                                <Group grow>
                                                    <ColorInput
                                                        label="History number color"
                                                        description="Big ticket / counter number in each entry"
                                                        swatches={COLOR_SWATCHES}
                                                        value={resolvedTheme.historyTextColor}
                                                        onChange={v => updateTheme({ historyTextColor: v })}
                                                    />
                                                    <ColorInput
                                                        label="History counter text"
                                                        description="Small counter code above the number"
                                                        swatches={COLOR_SWATCHES}
                                                        value={resolvedTheme.historySecondaryTextColor}
                                                        onChange={v => updateTheme({ historySecondaryTextColor: v })}
                                                    />
                                                </Group>

                                                <Group grow align="flex-end">
                                                    <TextInput
                                                        label="History header text"
                                                        description="Panel title (e.g. 'Recent calls')"
                                                        value={resolvedTheme.historyHeader}
                                                        onChange={e => updateTheme({ historyHeader: e.currentTarget.value })}
                                                    />
                                                    <ColorInput
                                                        label="History header color"
                                                        description="Color of the panel title (e.g. 'Recent calls')"
                                                        swatches={COLOR_SWATCHES}
                                                        value={resolvedTheme.historyHeaderColor}
                                                        onChange={v => updateTheme({ historyHeaderColor: v })}
                                                    />
                                                </Group>

                                                <Group grow align="flex-end">
                                                    <ColorInput
                                                        label="History border color"
                                                        description="Borders of the cards, panel and header in the recent calls panel"
                                                        swatches={COLOR_SWATCHES}
                                                        value={resolvedTheme.historyBorderColor ?? resolvedTheme.secondaryTextColor}
                                                        onChange={v => updateTheme({ historyBorderColor: v })}
                                                    />
                                                    <NumberInput
                                                        label="History border width"
                                                        description="Width in pixels"
                                                        min={0}
                                                        max={40}
                                                        step={1}
                                                        value={resolvedTheme.historyBorderWidth ?? 1}
                                                        onChange={v => updateTheme({ historyBorderWidth: typeof v === "number" ? v : 1 })}
                                                    />
                                                </Group>
                                            </Stack>
                                        </fieldset>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>

                    </Stack>
                </Tabs.Panel>
            </Tabs>

            <Group mt="xs" justify="flex-end" gap="sm">
                {onCancel && (
                    <Button variant="default" onClick={onCancel}>
                        Back
                    </Button>
                )}
                <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={guardarApariencia}
                >
                    Save
                </Button>
            </Group>

            {hasLayouts && (
                <Modal
                    opened={layoutModalOpen}
                    onClose={() => setLayoutModalOpen(false)}
                    title="Choose layout"
                    centered
                >
                    <Stack gap="xs">
                        {layouts.map(layout => {
                            const selected = layout.id === currentLayoutId;
                            return (
                                <Button
                                    key={layout.id}
                                    fullWidth
                                    variant={selected ? "filled" : "default"}
                                    color="blue"
                                    justify="space-between"
                                    rightSection={selected ? <IconCheck size={18} /> : undefined}
                                    onClick={() => {
                                        updateTheme({ layout: layout.id });
                                        setLayoutModalOpen(false);
                                    }}
                                >
                                    {layout.label}
                                </Button>
                            );
                        })}
                    </Stack>
                </Modal>
            )}

            <ThemePreviewModal
                opened={previewOpen}
                onClose={() => setPreviewOpen(false)}
                flowType={themeFlowType}
                theme={resolvedTheme}
            />

        </Stack>
    );


    const updatesPanel = (
        <UpdatePanel />
    );


    return (
        <Box
            h="100vh"
            bg="#f8f9fa"
            style={{
                display: "flex",
                overflow: "auto",
            }}
        >
            <Group gap={0} align="stretch" style={{ flex: 1, minWidth: 0 }}>
                <Stack
                    w={isNarrow ? 56 : 200}
                    p={isNarrow ? "xs" : "sm"}
                    gap={4}
                    style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
                >
                    <Brand size="sm" label={isNarrow ? "" : "Keues Monitor"} justify="center" />

                    <NavLink
                        label={isNarrow ? "" : "Configuration"}
                        leftSection={<IconPlugConnected size={isNarrow ? 20 : 16} />}
                        active={activeTab === "config"}
                        onClick={() => setActiveTab("config")}
                        styles={navStyles}
                    />
                    <NavLink
                        label={isNarrow ? "" : "Appearance"}
                        leftSection={<IconPalette size={isNarrow ? 20 : 16} />}
                        active={activeTab === "apariencia"}
                        onClick={() => setActiveTab("apariencia")}
                        styles={navStyles}
                    />
                    <NavLink
                        label={isNarrow ? "" : "Updates"}
                        leftSection={<IconRefresh size={isNarrow ? 20 : 16} />}
                        active={activeTab === "updates"}
                        onClick={() => setActiveTab("updates")}
                        styles={navStyles}
                    />

                    {!isNarrow && <VersionBadge fixed={false} style={{ marginTop: "auto", alignSelf: "flex-start" }} />}
                </Stack>

                <Box style={{ flex: 1, minWidth: 0 }} p="sm">
                    {activeTab === "config" && configPanel}
                    {activeTab === "apariencia" && appearancePanel}
                    {activeTab === "updates" && updatesPanel}
                </Box>
            </Group>
        </Box>
    );
}

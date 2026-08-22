import { useEffect, useState } from "react";
import { Center, Loader, Stack } from "@mantine/core";

import ConfigScreen from "./components/config/ConfigScreen";
import MonitorPanel from "./components/monitors/MonitorPanel";
import Brand from "./components/Brand";
import { isTauri, loadConfiguration } from "./api/appBridge";

import type { MonitorConfiguration } from "./types/config";


export default function App() {

    const [config, setConfig] = useState<MonitorConfiguration | null>(null);
    const [mostrarConfig, setMostrarConfig] = useState(false);
    const [cargando, setCargando] = useState(true);


    useEffect(() => {

        let mounted = true;

        async function init() {
            try {
                if (isTauri()) {
                    const result = await loadConfiguration();

                    if (mounted && result.success && result.config) {
                        const c = result.config;

                        if (c.server && c.locationId && c.flowId && c.flowType != null) {
                            setConfig(c);
                        }
                    }
                }
            }
            catch {
                // Sin configuración o error: se muestra la pantalla de configuración
            }
            finally {
                if (mounted)
                    setCargando(false);
            }
        }

        void init();

        return () => {
            mounted = false;
        };
    }, []);


    if (cargando) {
        return (
            <Center h="100vh" bg="#f8f9fa">
                <Stack align="center" gap="lg">
                    <Brand size="lg" />
                    <Loader size="lg" color="dark" />
                </Stack>
            </Center>
        );
    }

    if (!config || mostrarConfig) {
        return (
            <ConfigScreen
                initialConfig={config}
                onSaved={(c) => {
                    setConfig(c);
                    setMostrarConfig(false);
                }}
                onCancel={config ? () => setMostrarConfig(false) : undefined}
            />
        );
    }

    return (
        <MonitorPanel
            config={config}
            onOpenConfig={() => setMostrarConfig(true)}
        />
    );
}

import { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Divider,
    Group,
    Progress,
    Stack,
    Text
} from "@mantine/core";
import {
    IconAlertCircle,
    IconCircleCheck,
    IconDownload,
    IconRefresh,
    IconRocket
} from "@tabler/icons-react";

import { APP_VERSION } from "../../constants/app";
import {
    onUpdateState,
    checkForUpdates as checkForUpdatesRequest,
    downloadUpdate as downloadUpdateRequest,
    installUpdate,
} from "../../api/appBridge";

import type { UpdateState } from "../../api/appBridge";


export default function UpdatePanel() {

    const [updateState, setUpdateState] = useState<UpdateState | null>(null);


    useEffect(() => {

        const unsubscribe = onUpdateState((state) => {
            setUpdateState(state);
        });

        return () => {
            unsubscribe();
        };
    }, []);


    async function checkForUpdates() {
        setUpdateState({ state: "checking" });

        const result = await checkForUpdatesRequest();

        if (!result.success) {
            setUpdateState((previous) =>
                previous?.state === "error"
                    ? previous
                    : { state: "error", error: result.error ?? "Could not check for updates" }
            );
        }
    }


    async function downloadUpdate() {
        setUpdateState((previous) => ({
            state: "downloading",
            percent: 0,
            version: previous?.version
        }));

        const result = await downloadUpdateRequest();

        if (!result.success) {
            setUpdateState((previous) =>
                previous?.state === "error"
                    ? previous
                    : { state: "error", error: result.error ?? "Could not download the update" }
            );
        }
    }


    async function restartAndInstall() {
        await installUpdate();
    }


    return (
        <Stack gap="lg">
            <Divider label="Application version" labelPosition="left" />

            <Group gap="xs">
                <Text size="sm" c="dimmed">
                    Current version
                </Text>

                <Badge variant="light" color="blue" radius="sm">
                    {APP_VERSION}
                </Badge>
            </Group>

            <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                loading={updateState?.state === "checking"}
                onClick={checkForUpdates}
                style={{ alignSelf: "flex-start" }}
            >
                Check for updates
            </Button>

            {updateState?.state === "not-available" && (
                <Alert color="green" icon={<IconCircleCheck size={16} />}>
                    You have the latest version
                    {updateState.version ? ` (${updateState.version})` : ""}.
                </Alert>
            )}

            {updateState?.state === "available" && (
                <Alert
                    color="blue"
                    icon={<IconDownload size={16} />}
                    title={`New version available: ${updateState.version ?? ""}`}
                >
                    <Stack gap="sm" mt="xs">
                        <Text size="sm">
                            Do you want to download and install it now? The application will restart
                            when the installation finishes.
                        </Text>

                        <Button leftSection={<IconDownload size={16} />} onClick={downloadUpdate}>
                            Download and install
                        </Button>
                    </Stack>
                </Alert>
            )}

            {updateState?.state === "downloading" && (
                <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                        Downloading update… {Math.round(updateState.percent ?? 0)}%
                    </Text>

                    <Progress value={updateState.percent ?? 0} animated />
                </Stack>
            )}

            {updateState?.state === "downloaded" && (
                <Alert
                    color="green"
                    icon={<IconCircleCheck size={16} />}
                    title={`Version ${updateState.version ?? ""} ready to install`}
                >
                    <Stack gap="sm" mt="xs">
                        <Text size="sm">
                            The update has been downloaded. Restart the application to install it.
                        </Text>

                        <Button color="green" leftSection={<IconRocket size={16} />} onClick={restartAndInstall}>
                            Restart and install
                        </Button>
                    </Stack>
                </Alert>
            )}

            {updateState?.state === "error" && (
                <Alert color="red" icon={<IconAlertCircle size={16} />}>
                    {updateState.error ?? "Error checking for updates"}
                </Alert>
            )}
        </Stack>
    );
}

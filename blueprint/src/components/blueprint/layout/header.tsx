import {SeedResultsContainer} from "../../../modules/ImmolateWrapper/CardEngines/Cards.ts";
import {useViewportSize} from "@mantine/hooks";
import {useCardStore} from "../../../modules/state/store.ts";
import {ActionIcon, AppShell, Box, Burger, Button, Center, Container, CopyButton, Group, Title} from "@mantine/core";
import SearchSeedInput from "../../searchInput.tsx";
import {useGA} from "../../../modules/useGA.ts";
import {IconCheck, IconLink} from "@tabler/icons-react";



export default function Header({SeedResults}: {
    SeedResults: SeedResultsContainer | null,
    theme: string,
    setTheme: any
}) {
    const {width} = useViewportSize();
    const start = useCardStore(state => state.applicationState.start)
    const settingsOpened = useCardStore(state => state.applicationState.settingsOpen);
    const toggleSettings = useCardStore(state => state.toggleSettings);

    const outputOpened = useCardStore(state => state.applicationState.asideOpen);
    const toggleOutput = useCardStore(state => state.toggleOutput);
    const hasResults = start || !!SeedResults;
    const showFullSearch = hasResults && width > 1120;
    const showCompactSearch = hasResults && width <= 1120;
    const showFullCopy = hasResults && width > 920;
    const showCompactCopy = hasResults && width <= 920;
    const showPanelButton = width > 980;
    return (
        <AppShell.Header>
            <Container fluid h={'100%'}>
                <Group h={'100%'} justify={'space-between'} wrap="nowrap">
                    <Group flex={1} wrap="nowrap" gap="sm">
                        <Burger opened={settingsOpened} onClick={toggleSettings} hiddenFrom={'md'} size="sm"/>
                        <Center h={'100%'}>
                            <Group grow>
                                <Box flex={1}>
                                    <Title order={3}>Balatro Seed Analyzer</Title>
                                </Box>
                            </Group>
                        </Center>
                    </Group>

                    <Group align={'center'} wrap="nowrap" gap="xs">
                        {showFullSearch && <SearchSeedInput SeedResults={SeedResults}/>}
                        {showCompactSearch && <SearchSeedInput SeedResults={SeedResults} compact />}
                        {showFullCopy && (
                            <CopyButton value={new URL(window.location.href).toString()}>
                                {({copied, copy}) => (
                                    <Button color={copied ? 'teal' : 'blue'} size="sm" onClick={copy}>
                                        {copied ? 'Copied url' : 'Copy url'}
                                    </Button>
                                )}
                            </CopyButton>
                        )}
                        {showCompactCopy && (
                            <CopyButton value={new URL(window.location.href).toString()}>
                                {({copied, copy}) => (
                                    <ActionIcon
                                        variant="filled"
                                        color={copied ? 'teal' : 'blue'}
                                        size="lg"
                                        aria-label={copied ? 'Copied url' : 'Copy url'}
                                        onClick={copy}
                                    >
                                        {copied ? <IconCheck size={18}/> : <IconLink size={18}/>}
                                    </ActionIcon>
                                )}
                            </CopyButton>
                        )}
                        {showPanelButton ? (
                            <Button
                                variant={outputOpened ? 'filled' : 'default'}
                                size="sm"
                                onClick={()=>{
                                    useGA('side_panel_toggled')
                                    toggleOutput()
                                }}
                            >
                                {outputOpened ? 'Hide panel' : 'Open panel'}
                            </Button>
                        ) : (
                            <Burger opened={outputOpened} onClick={()=>{
                                useGA('side_panel_toggled')
                                toggleOutput()
                            }} size="sm"/>
                        )}
                    </Group>
                </Group>
            </Container>
        </AppShell.Header>
    )
}

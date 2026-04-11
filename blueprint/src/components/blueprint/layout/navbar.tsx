import {
    AppShell,
    Box,
    Button,
    CopyButton,
    Divider,
    Group,
    InputLabel,
    NativeSelect,
    NumberInput,
    ScrollArea,
    SegmentedControl,
    Select,
    SimpleGrid,
    Switch,
    Text,
    Tooltip,
    useMantineColorScheme,
    useMantineTheme
} from "@mantine/core";
import {useCardStore} from "../../../modules/state/store.ts";
import UnlocksModal from "../../unlocksModal.tsx";
import FeaturesModal from "../../FeaturesModal.tsx";
import {RerollCalculatorModal} from "../../RerollCalculatorModal.tsx";
import {useGA} from "../../../modules/useGA.ts";
import {
    IconFileText,
    IconJoker,
    IconLayout,
    IconListSearch,
    IconMoon,
    IconPlayCard,
    IconSun
} from "@tabler/icons-react";
import SeedInputAutoComplete from "../../SeedInputAutoComplete.tsx";
import {useEffect} from "react";
import {themeNames} from "../../../App.tsx";

export default function NavBar({ themeName, setTheme }: { themeName: string, setTheme: any }) {
    const theme = useMantineTheme();
    const colorScheme = useMantineColorScheme()
    const viewMode = useCardStore(state => state.applicationState.viewMode);
    const setViewMode = useCardStore(state => state.setViewMode);
    const events = useCardStore(state => state.eventState.events);
    const analyzeState = useCardStore(state => state.immolateState);
    const { seed, deck, stake, gameVersion: version, antes, cardsPerAnte } = analyzeState;
    const showCardSpoilers = useCardStore(state => state.applicationState.showCardSpoilers);
    const useCardPeek = useCardStore(state => state.applicationState.useCardPeek);
    const setUseCardPeek = useCardStore(state => state.setUseCardPeek);
    const maxMiscCardSource = useCardStore(state => state.applicationState.maxMiscCardSource);
    const setMiscMaxSource = useCardStore(state => state.setMiscMaxSource);
    const selectedOptions = useCardStore(state => state.immolateState.selectedOptions);

    const setSeed = useCardStore(state => state.setSeed);
    const setDeck = useCardStore(state => state.setDeck);
    const setStake = useCardStore(state => state.setStake);
    const setVersion = useCardStore(state => state.setGameVersion);
    const setAntes = useCardStore(state => state.setAntes);
    const setCardsPerAnte = useCardStore(state => state.setCardsPerAnte);
    const setShowCardSpoilers = useCardStore(state => state.setShowCardSpoilers);
    const setStart = useCardStore(state => state.setStart);
    const openSelectOptionModal = useCardStore(state => state.openSelectOptionModal);
    const openFeaturesModal = useCardStore(state => state.openFeaturesModal);
    const openSnapshotModal = useCardStore(state => state.openSnapshotModal);
    const rerollCalculatorModalOpen = useCardStore(state => state.applicationState.rerollCalculatorModalOpen);
    const rerollCalculatorMetadata = useCardStore(state => state.applicationState.rerollCalculatorMetadata);
    const closeRerollCalculatorModal = useCardStore(state => state.closeRerollCalculatorModal);
    const reset = useCardStore(state => state.reset);
    const hasSettingsChanged = useCardStore((state) => state.applicationState.hasSettingsChanged);


    const start = useCardStore(state => state.applicationState.start);
    const analyzeSeed = useCardStore(state => state.analyzeSeed);
    const seedResults = useCardStore(state => state.applicationState.analyzedResults);
    const buys = useCardStore(state => state.shoppingState.buys);
    const handleAnalyzeClick = () => {
        setStart(true);
        analyzeSeed();
    }

    useEffect(() => {
        if (start && !seedResults) {
            analyzeSeed()
        }
    }, [start, seedResults]);
    useEffect(() => {
        if (start && seedResults) {
            analyzeSeed();
        }
    }, [showCardSpoilers, deck, stake, version, antes, cardsPerAnte, events, buys, maxMiscCardSource, selectedOptions])


    return (
        <AppShell.Navbar p="sm">
            <UnlocksModal />
            <FeaturesModal />
            <RerollCalculatorModal
                opened={rerollCalculatorModalOpen}
                onClose={closeRerollCalculatorModal}
                targetIndex={rerollCalculatorMetadata?.index ?? 0}
                metaData={rerollCalculatorMetadata}
            />
            <AppShell.Section>
                <SegmentedControl
                    fullWidth
                    size="sm"
                    value={viewMode}
                    onChange={(value: string) => setViewMode(value)}
                    data={[
                        {
                            value: 'blueprint',
                            label: (
                                <Group gap={6} wrap="nowrap">
                                    <IconLayout size={16} />
                                    <Text span>Analyzer</Text>
                                </Group>
                            )
                        },
                        {
                            value: 'simple',
                            label: (
                                <Group gap={6} wrap="nowrap">
                                    <IconListSearch size={16} />
                                    <Text span>Efficiency</Text>
                                </Group>
                            )
                        },
                        {
                            value: 'text',
                            label: (
                                <Group gap={6} wrap="nowrap">
                                    <IconFileText size={16} />
                                    <Text span>Text</Text>
                                </Group>
                            )
                        }
                    ]}
                    mb="sm"
                />
                <Divider mb='sm' />

                <Group align={'flex-end'} gap="xs" wrap="nowrap">
                    <Select
                        size="sm"
                        label={'Theme'}
                        value={themeName}
                        onChange={setTheme}
                        data={themeNames}
                        flex={1}
                    />
                    <Switch
                        size={'lg'}
                        checked={colorScheme.colorScheme === 'dark'}
                        thumbIcon={colorScheme.colorScheme === 'dark' ? (<IconSun size={16} color={'var(--mantine-color-teal-6)'} />) : (<IconMoon size={16} />)}
                        onChange={colorScheme.toggleColorScheme}
                    />
                </Group>


            </AppShell.Section>
            <AppShell.Section pr={'xs'} grow my="sm" component={ScrollArea} scrollbars={'y'}>
                <SeedInputAutoComplete
                    seed={seed}
                    setSeed={setSeed}
                />
                <NumberInput
                    size="sm"
                    label={'Max Ante'}
                    defaultValue={8}
                    value={antes}
                    onChange={(val) => setAntes(Number(val))}
                />
                <NativeSelect
                    size="sm"
                    label={'Choose Deck'}
                    value={deck}
                    onChange={(e) => setDeck(e.currentTarget.value)}
                >
                    <option value="Red Deck">Red Deck</option>
                    <option value="Blue Deck">Blue Deck</option>
                    <option value="Yellow Deck">Yellow Deck</option>
                    <option value="Green Deck">Green Deck</option>
                    <option value="Black Deck">Black Deck</option>
                    <option value="Magic Deck">Magic Deck</option>
                    <option value="Nebula Deck">Nebula Deck</option>
                    <option value="Ghost Deck">Ghost Deck</option>
                    <option value="Abandoned Deck">Abandoned Deck</option>
                    <option value="Checkered Deck">Checkered Deck</option>
                    <option value="Zodiac Deck">Zodiac Deck</option>
                    <option value="Painted Deck">Painted Deck</option>
                    <option value="Anaglyph Deck">Anaglyph Deck</option>
                    <option value="Plasma Deck">Plasma Deck</option>
                    <option value="Erratic Deck">Erratic Deck</option>
                </NativeSelect>
                <NativeSelect
                    size="sm"
                    label={'Choose Stake'}
                    value={stake}
                    onChange={(e) => setStake(e.currentTarget.value)}
                >
                    <option value="White Stake">White Stake</option>
                    <option value="Red Stake">Red Stake</option>
                    <option value="Green Stake">Green Stake</option>
                    <option value="Black Stake">Black Stake</option>
                    <option value="Blue Stake">Blue Stake</option>
                    <option value="Purple Stake">Purple Stake</option>
                    <option value="Orange Stake">Orange Stake</option>
                    <option value="Gold Stake">Gold Stake</option>
                </NativeSelect>
                <NativeSelect
                    size="sm"
                    label={'Choose Version'}
                    value={version}
                    onChange={(e) => setVersion(e.currentTarget.value)}
                    mb={'sm'}
                >
                    <option value="10106">1.0.1f</option>
                    <option value="10103">1.0.1c</option>
                    <option value="10014">1.0.0n</option>
                </NativeSelect>
                <InputLabel> Cards per Ante</InputLabel>
                <Text fz={'xs'} c={'dimmed'}>
                    It is recommended to keep this number under 200.
                </Text>
                <Button.Group w={'100%'} mb={'sm'}>
                    <Button size="xs" variant="default" c={'blue'} onClick={() => setCardsPerAnte(50)}>50</Button>
                    <Button size="xs" variant="default" c={'red'} onClick={() => setCardsPerAnte(Math.max(cardsPerAnte - 50, 0))}>-50</Button>
                    <Button.GroupSection flex={1} variant="default" bg="var(--mantine-color-body)" miw={80}>
                        {cardsPerAnte}
                    </Button.GroupSection>
                    <Button size="xs" variant="default" c={'green'}
                        onClick={() => setCardsPerAnte(Math.min(cardsPerAnte + 50, 1000))}>+50</Button>
                    <Button size="xs" variant="default" c={'blue'} onClick={() => setCardsPerAnte(1000)}>1000</Button>
                </Button.Group>
                <InputLabel> Cards per Misc source</InputLabel>
                <Text fz={'xs'} c={'dimmed'}>
                    It is recommended to keep this number under 50.
                </Text>
                <Button.Group w={'100%'} mb={'sm'}>
                    <Button size="xs" variant="default" c={'blue'} onClick={() => setMiscMaxSource(15)}>15</Button>
                    <Button size="xs" variant="default" c={'red'} onClick={() => setMiscMaxSource(Math.max(maxMiscCardSource - 5, 0))}>-5</Button>
                    <Button.GroupSection flex={1} variant="default" bg="var(--mantine-color-body)" miw={80}>
                        {maxMiscCardSource}
                    </Button.GroupSection>
                    <Button size="xs" variant="default" c={'green'}
                        onClick={() => setMiscMaxSource(Math.min(maxMiscCardSource + 5, 100))}>+5</Button>
                    <Button size="xs" variant="default" c={'blue'} onClick={() => setMiscMaxSource(100)}>100</Button>
                </Button.Group>
                <Group justify={'space-between'} align="start" gap="xs" wrap="nowrap">
                    <Box>
                        <Text mb={0} fz={'xs'}>Show Joker Spoilers</Text>
                        <Tooltip label="Cards that give jokers, are replaced with the joker the card would give."
                            refProp="rootRef">
                            <Switch
                                size={'lg'}
                                checked={showCardSpoilers}
                                thumbIcon={showCardSpoilers ? (<IconJoker color={'black'} />) : (
                                    <IconPlayCard color={'black'} />)}
                                onChange={() => setShowCardSpoilers(!showCardSpoilers)}
                            />
                        </Tooltip>
                    </Box>
                    <Box>
                        <Text mb={0} fz={'xs'}>Quick Reroll</Text>
                        <Tooltip label="Long pressing a card in the shop queue, will reroll that card."
                            refProp="rootRef">
                            <Switch
                                size={'lg'}
                                checked={useCardPeek}
                                onChange={() => setUseCardPeek(!useCardPeek)}
                            />
                        </Tooltip>
                    </Box>
                </Group>
            </AppShell.Section>
            <AppShell.Section my="sm">
                <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs" className="seedBlueprintActionGrid">
                    <Button
                        className="seedBlueprintSidebarAnalyze"
                        size="sm"
                        fullWidth
                        onClick={handleAnalyzeClick}
                        disabled={!hasSettingsChanged}
                        color={hasSettingsChanged ? "green" : "gray"}
                    >
                        Analyze Seed
                    </Button>
                    <CopyButton value={seed}>
                        {({copied, copy}) => (
                            <Button
                                className="seedBlueprintSidebarAction seedBlueprintSidebarAction--copy"
                                size="sm"
                                fullWidth
                                variant="default"
                                disabled={!seed}
                                onClick={copy}
                            >
                                {copied ? 'Copied Seed' : 'Copy Seed'}
                            </Button>
                        )}
                    </CopyButton>
                    <Button
                        className="seedBlueprintSidebarAction seedBlueprintSidebarAction--features"
                        size="sm"
                        fullWidth
                        color={theme.colors.grape[9]}
                        onClick={() => {
                            useGA('view_features');
                            openFeaturesModal()
                        }}
                    >
                        Features
                    </Button>
                    <Button
                        className="seedBlueprintSidebarAction seedBlueprintSidebarAction--unlocks"
                        size="sm"
                        fullWidth
                        color={theme.colors.blue[9]}
                        onClick={() => openSelectOptionModal()}
                    >
                        Modify Unlocks
                    </Button>
                    <Button
                        className="seedBlueprintSidebarAction seedBlueprintSidebarAction--summary"
                        size="sm"
                        fullWidth
                        color={theme.colors.cyan[9]}
                        onClick={() => {
                            openSnapshotModal();
                            useGA('view_seed_snapshot');
                        }}
                    >
                        Seed Summary
                    </Button>
                    <Button
                        className="seedBlueprintSidebarAction seedBlueprintSidebarAction--reset"
                        size="sm"
                        fullWidth
                        color={theme.colors.red[9]}
                        variant={'filled'}
                        onClick={() => reset()}
                    >
                        Reset
                    </Button>
                </SimpleGrid>
            </AppShell.Section>
        </AppShell.Navbar>
    )
}

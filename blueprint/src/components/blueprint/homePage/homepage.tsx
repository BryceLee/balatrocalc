import {IconEye, IconGauge, IconList, IconMessage2, IconShoppingCart, IconUser} from '@tabler/icons-react';
import {Container, Paper, SimpleGrid, Space, Stack, Text, ThemeIcon, Title} from '@mantine/core';
import classes from './Homepage.module.css';
import HeroClasses from "./Hero.module.css"
import React from "react";
import {QuickAnalyze} from "../../SeedInputAutoComplete.tsx";

export const Features = [
    {
        icon: IconGauge,
        title: 'Accuracy',
        description:
            'Deterministic seed simulation keeps shop queues and outcomes consistent across runs.',
    },
    {
        icon: IconUser,
        title: 'Personalized experience',
        description:
            'Tune spoiler depth and filters to match how much you want to see.',
    },
    {
        icon: IconEye,
        title: 'Card Spoilers',
        description:
            'Reveal the actual jokers from cards like The Soul, Judgement, and Wraith.',
    },
    {
        icon: IconShoppingCart,
        title: 'Card Buying',
        description:
            'Plan buys and rerolls to build a shopping list for each ante.',
    },
    {
        icon: IconList,
        title: 'In Depth',
        description:
            'Track packs, tags, vouchers, and other non-shop sources in one place.',
    },
    {
        icon: IconMessage2,
        title: 'Shareable routes',
        description:
            'Create shareable snapshots and routes to review runs with others.',
    },
];

interface FeatureProps {
    icon: React.FC<any>;
    title: React.ReactNode;
    description: React.ReactNode;
}

export function Feature({icon: Icon, title, description}: FeatureProps) {
    return (
        <Paper withBorder p={'1rem'} shadow={'lg'}>
            <ThemeIcon variant="light" size={40} radius={40}>
                <Icon size={18} stroke={1.5}/>
            </ThemeIcon>
            <Text mt="sm" mb={7}>
                {title}
            </Text>
            <Text size="sm" c="dimmed" lh={1.6}>
                {description}
            </Text>
        </Paper>
    );
}

function HeroText() {
    return (
        <Container fluid mb={'xl'} px={'xl'}>
            <div className={HeroClasses.inner}>
                <Title className={HeroClasses.title}>
                    Fully featured {' '}
                    <Text component="span" className={HeroClasses.highlight} inherit>
                        seed-routing and analysis
                    </Text>{' '}
                    in a modern UI
                </Title>

                <Container p={0} fluid>
                    <Text size="lg" c="dimmed" className={HeroClasses.description}>
                        Balatro Seed Analyzer is a focused tool for analyzing and routing seeds in Balatro. Review shop
                        queues, compare antes, and plan routes. It is not affiliated with the game or its developer.
                    </Text>
                </Container>

                <div className={HeroClasses.controls}>
                    <Stack gap={'sm'} w={'100%'}>
                        <QuickAnalyze/>
                        <Text ta={'right'} fz={'sm'} c={'dimmed'}>
                            Want to search for seeds instead ?
                            Try {" "}
                            <Text
                                component={'a'}
                                fz={'sm'}
                                style={{ textDecoration: 'underline'}}
                                href={'https://github.com/OptimusPi/MotelyJAML/releases/tag/v1.0.0'}
                            >
                                MotelyJAML
                            </Text>
                        </Text>
                    </Stack>

                </div>

            </div>
        </Container>
    );
}

export function FeaturesGrid() {
    const features = Features.map((feature, index) => <Feature {...feature} key={index}/>);

    return (
        <Container fluid className={classes.wrapper} px={'xl'}>
            <HeroText/>
            <Space my={'xl'}/>
            <Paper p={'2rem'}>
                <SimpleGrid
                    mt={60}
                    cols={{base: 1, sm: 2, md: 3}}
                    spacing={{base: 'xl', md: 50}}
                    verticalSpacing={{base: 'xl', md: 50}}
                >
                    {features}
                </SimpleGrid>
            </Paper>
        </Container>
    );
}


export default function HomePage() {
    return (
        <Container fluid>
            <FeaturesGrid/>
        </Container>
    )
}

// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { LEGEND_ITEMS, type DistanceFilter } from "../trackerConfig";

interface DistancePanelProps {
    isOpen: boolean;
    activeFilter: DistanceFilter;
    onOpen: () => void;
    onClose: () => void;
    onSelectFilter: (filter: DistanceFilter) => void;
}

interface FilterButtonProps {
    value: DistanceFilter;
    activeFilter: DistanceFilter;
    onSelect: (filter: DistanceFilter) => void;
    children: string;
}

function FilterButton(props: FilterButtonProps) {
    const { value, activeFilter, onSelect, children } = props;
    const isActive = activeFilter === value;

    return (
        <Button
            onClick={() => onSelect(value)}
            className="tracker-filter-button"
            data-active={isActive}
            flex="1"
            px="1"
            py="2.5"
            h="auto"
            fontSize="15px"
            fontWeight="bold"
            borderWidth="1px"
            borderColor={isActive ? "#003366" : "#ccc"}
            borderRadius="6px"
            bg={isActive ? "#003366" : "white"}
            color={isActive ? "white" : "black"}
            _hover={{ bg: isActive ? "#002a52" : "gray.50" }}
        >
            {children}
        </Button>
    );
}

export function DistancePanel(props: DistancePanelProps) {
    const { isOpen, activeFilter, onOpen, onClose, onSelectFilter } = props;

    if (!isOpen) {
        return (
            <IconButton
                aria-label="Panel öffnen"
                aria-expanded={isOpen}
                onClick={onOpen}
                className="tracker-icon-button"
                size="md"
                variant="outline"
                borderColor="#cfd6dd"
                color="#1f2a36"
                bg="rgba(255,255,255,0.95)"
                boxShadow="0 4px 12px rgba(0,0,0,0.15)"
                _hover={{ bg: "white" }}
            >
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                    <line
                        x1="3.5"
                        y1="5"
                        x2="16.5"
                        y2="5"
                        stroke="#1f2a36"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="3.5"
                        y1="10"
                        x2="16.5"
                        y2="10"
                        stroke="#1f2a36"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <line
                        x1="3.5"
                        y1="15"
                        x2="16.5"
                        y2="15"
                        stroke="#1f2a36"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </IconButton>
        );
    }

    return (
        <VStack
            className="tracker-panel"
            bg="rgba(255,255,255,0.95)"
            borderRadius="12px"
            boxShadow="0 4px 12px rgba(0,0,0,0.15)"
            p="4"
            w="200px"
            fontSize="14px"
            align="stretch"
        >
            <VStack align="stretch" gap="2">
                <HStack className="tracker-panel-title-row" justify="space-between" gap="2">
                    <Text className="tracker-panel-title" fontWeight="bold" fontSize="15px">
                        Distanz wählen:
                    </Text>
                    <IconButton
                        aria-label="Panel schließen"
                        onClick={onClose}
                        className="tracker-icon-button"
                        size="sm"
                        variant="outline"
                        borderColor="#cfd6dd"
                        color="#1f2a36"
                        bg="white"
                        _hover={{ bg: "gray.50" }}
                    >
                        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                            <line
                                x1="5"
                                y1="5"
                                x2="15"
                                y2="15"
                                stroke="#1f2a36"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <line
                                x1="15"
                                y1="5"
                                x2="5"
                                y2="15"
                                stroke="#1f2a36"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </IconButton>
                </HStack>

                <HStack gap="2">
                    <FilterButton value="all" activeFilter={activeFilter} onSelect={onSelectFilter}>
                        Alle
                    </FilterButton>
                    <FilterButton value="volks" activeFilter={activeFilter} onSelect={onSelectFilter}>
                        Volks
                    </FilterButton>
                    <FilterButton value="olymp" activeFilter={activeFilter} onSelect={onSelectFilter}>
                        Olymp
                    </FilterButton>
                </HStack>
            </VStack>

            <Box className="tracker-panel-divider" my="1"></Box>

            <Box>
                <Text className="tracker-legend-title" mb="2" fontWeight="bold" fontSize="15px">
                    Disziplinen:
                </Text>
                {LEGEND_ITEMS.map((item) => (
                    <HStack key={item.label} className="tracker-legend-row" mt="1.5" align="center">
                        <Box className="tracker-legend-swatch" w="24px" h="6px" borderRadius="3px" mr="2.5" bg={item.color}></Box>
                        <Text className="tracker-legend-label" fontSize="14px" fontWeight="bold">
                            {item.label}
                        </Text>
                    </HStack>
                ))}
            </Box>
        </VStack>
    );
}

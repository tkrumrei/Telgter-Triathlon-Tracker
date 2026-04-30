// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { useState } from "react";
import {
    type DistanceCategory,
    FINISHERS,
    SCHEDULE_TIMES
} from "../trackerConfig";

interface InfoPanelProps {
    isOpen: boolean;
    activeFilter: DistanceCategory;
    onSelectFilter: (filter: DistanceCategory) => void;
    onClose: () => void;
}

function toSeconds(time: string): number {
    if (!time.trim()) {
        return Number.POSITIVE_INFINITY;
    }

    const parts = time.split(":").map((part) => Number(part));
    const [hours = 0, minutes = 0, seconds = 0] = parts;

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
        return Number.POSITIVE_INFINITY;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

type InfoView = "race" | "finishers";

export function InfoPanel(props: InfoPanelProps) {
    const { isOpen, activeFilter, onSelectFilter, onClose } = props;
    const intl = useIntl();
    const [activeView, setActiveView] = useState<InfoView>("race");

    if (!isOpen) {
        return null;
    }

    const scheduleMap = new Map(
        SCHEDULE_TIMES.map((entry) => [entry.distanz, entry] as const)
    );

    const filteredFinishers = FINISHERS.filter((entry) => entry.distanz === activeFilter).sort(
        (left, right) => toSeconds(left.finishTime) - toSeconds(right.finishTime)
    );

    const scheduleRows = [
        {
            label: intl.formatMessage({ id: "infoPanel.schedule.row.swimStart" }),
            volks: scheduleMap.get("volks")?.startTime ?? "-",
            olymp: scheduleMap.get("olymp")?.startTime ?? "-"
        },
        {
            label: intl.formatMessage({ id: "infoPanel.schedule.row.bikeArrival" }),
            volks: scheduleMap.get("volks")?.bikeArrivalEstimate ?? "-",
            olymp: scheduleMap.get("olymp")?.bikeArrivalEstimate ?? "-"
        },
        {
            label: intl.formatMessage({ id: "infoPanel.schedule.row.finish" }),
            volks: scheduleMap.get("volks")?.finishArrivalEstimate ?? "-",
            olymp: scheduleMap.get("olymp")?.finishArrivalEstimate ?? "-"
        }
    ];

    return (
        <Box
            className="tracker-info-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={intl.formatMessage({ id: "infoPanel.dialogLabel" })}
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            left="0"
            zIndex={3000}
            bg="#eff4f9"
            p={{ base: "10px", md: "12px" }}
        >
            <VStack
                className="tracker-info-panel"
                align="center"
                gap="6"
                h="100%"
                w="100%"
                bg="white"
                borderRadius="10px"
                boxShadow="0 10px 24px rgba(0, 0, 0, 0.16)"
                p={{ base: "12px", md: "18px" }}
            >
                <Box className="tracker-info-header" position="relative" w="100%">
                    <VStack align="center" gap="1">
                        <Box
                            role="tablist"
                            aria-label={intl.formatMessage({ id: "infoPanel.tabListLabel" })}
                            display="inline-flex"
                            alignItems="center"
                            border="1px solid #b9cbe0"
                            borderRadius="999px"
                            bg="linear-gradient(180deg, #edf4fc 0%, #e6eff9 100%)"
                            p="4px"
                            boxShadow="inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 3px 10px rgba(25, 54, 88, 0.14)"
                            overflow="hidden"
                        >
                            <Box
                                as="button"
                                onClick={() => setActiveView("race")}
                                minW={{ base: "112px", md: "132px" }}
                                px={{ base: "10px", md: "18px" }}
                                py={{ base: "8px", md: "10px" }}
                                fontSize={{ base: "14px", md: "15px" }}
                                fontWeight="700"
                                lineHeight="1.1"
                                borderRadius="999px"
                                color={activeView === "race" ? "#ffffff" : "#2a4767"}
                                bg={
                                    activeView === "race"
                                        ? "linear-gradient(180deg, #0f4a83 0%, #0a3b69 100%)"
                                        : "transparent"
                                }
                                boxShadow={activeView === "race" ? "0 4px 10px rgba(12, 52, 92, 0.32)" : "none"}
                                transition="background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease"
                                cursor="pointer"
                            >
                                {intl.formatMessage({ id: "infoPanel.tab.race" })}
                            </Box>
                            <Box
                                as="button"
                                onClick={() => setActiveView("finishers")}
                                minW={{ base: "112px", md: "132px" }}
                                px={{ base: "10px", md: "18px" }}
                                py={{ base: "8px", md: "10px" }}
                                fontSize={{ base: "14px", md: "15px" }}
                                fontWeight="700"
                                lineHeight="1.1"
                                borderRadius="999px"
                                color={activeView === "finishers" ? "#ffffff" : "#2a4767"}
                                bg={
                                    activeView === "finishers"
                                        ? "linear-gradient(180deg, #0f4a83 0%, #0a3b69 100%)"
                                        : "transparent"
                                }
                                boxShadow={activeView === "finishers" ? "0 4px 10px rgba(12, 52, 92, 0.32)" : "none"}
                                transition="background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease"
                                cursor="pointer"
                            >
                                {intl.formatMessage({ id: "infoPanel.tab.finishers" })}
                            </Box>
                        </Box>
                    </VStack>

                    <IconButton
                        aria-label={intl.formatMessage({ id: "infoPanel.closeButtonLabel" })}
                        onClick={onClose}
                        className="tracker-info-close-button"
                        size="sm"
                        variant="outline"
                        borderColor="#cfd6dd"
                        color="#1f2a36"
                        bg="white"
                        position="absolute"
                        top="0"
                        right="0"
                        _hover={{ bg: "gray.50" }}
                    >
                        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                            <line x1="5" y1="5" x2="15" y2="15" stroke="#1f2a36" strokeWidth="2" strokeLinecap="round" />
                            <line x1="15" y1="5" x2="5" y2="15" stroke="#1f2a36" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </IconButton>
                </Box>

                {activeView === "race" && (
                    <>
                        <Box className="tracker-info-card tracker-info-section-wrap">
                            <Text className="tracker-info-section-title" fontSize={{ base: "28px", md: "32px" }} w="100%" textAlign="center">
                                {intl.formatMessage({ id: "infoPanel.schedule.title" })}
                            </Text>
                            <Box className="tracker-info-table-wrap" overflowX="auto" px="2" py="2">
                                <Box
                                    minW={{ base: "100%", md: "760px" }}
                                    display="grid"
                                    gridTemplateColumns={{
                                        base: "minmax(150px, 1.5fr) minmax(80px, 1fr) minmax(80px, 1fr)",
                                        md: "minmax(260px, 1.7fr) minmax(140px, 1fr) minmax(140px, 1fr)"
                                    }}
                                    columnGap={{ base: "12px", md: "38px" }}
                                    rowGap="12px"
                                    alignItems="center"
                                    justifyItems="center"
                                    justifyContent="center"
                                >
                                    <Text fontWeight="bold" color="#1f3c5e" textAlign="center">
                                        {intl.formatMessage({ id: "infoPanel.schedule.col.timepoint" })}
                                    </Text>
                                    <Text fontWeight="bold" color="#1f3c5e" textAlign="center">
                                        {intl.formatMessage({ id: "infoPanel.schedule.col.volks" })}
                                    </Text>
                                    <Text fontWeight="bold" color="#1f3c5e" textAlign="center">
                                        {intl.formatMessage({ id: "infoPanel.schedule.col.olymp" })}
                                    </Text>

                                    {scheduleRows.flatMap((row) => [
                                        <Text key={`${row.label}-label`} fontWeight="bold" textAlign="center">{row.label}</Text>,
                                        <Text key={`${row.label}-volks`} textAlign="center">{row.volks}</Text>,
                                        <Text key={`${row.label}-olymp`} textAlign="center">{row.olymp}</Text>
                                    ])}
                                </Box>
                            </Box>
                        </Box>

                        <Box className="tracker-info-card tracker-info-section-wrap">
                            <Text className="tracker-info-section-title" fontSize={{ base: "28px", md: "32px" }} w="100%" textAlign="center">
                                {intl.formatMessage({ id: "infoPanel.distances.title" })}
                            </Text>
                            <Box
                                display="grid"
                                gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
                                gap={{ base: "12px", md: "18px" }}
                                w="100%"
                            >
                                <Box bg="#f6faff" border="1px solid #d9e4ef" borderRadius="10px" p="12px">
                                    <Text fontWeight="bold" textAlign="center" color="#1f3c5e" mb="1">
                                        {intl.formatMessage({ id: "infoPanel.distances.volks.title" })}
                                    </Text>
                                    <Text textAlign="center" color="#213a55">
                                        {intl.formatMessage({ id: "infoPanel.distances.volks.description" })}
                                    </Text>
                                </Box>

                                <Box bg="#f6faff" border="1px solid #d9e4ef" borderRadius="10px" p="12px">
                                    <Text fontWeight="bold" textAlign="center" color="#1f3c5e" mb="1">
                                        {intl.formatMessage({ id: "infoPanel.distances.olymp.title" })}
                                    </Text>
                                    <Text textAlign="center" color="#213a55">
                                        {intl.formatMessage({ id: "infoPanel.distances.olymp.description" })}
                                    </Text>
                                </Box>
                            </Box>
                        </Box>
                    </>
                )}

                {activeView === "finishers" && (
                    <Box className="tracker-info-card tracker-info-finishers tracker-info-section-wrap">
                        <Text className="tracker-info-section-title" fontSize={{ base: "28px", md: "32px" }} w="100%" textAlign="center">
                            {intl.formatMessage({ id: "infoPanel.finishers.title" })}
                        </Text>
                        <HStack gap="2" wrap="wrap" justify="center" w="100%" mb="2">
                            {(["volks", "olymp"] as const).map((filter) => {
                                const isActive = activeFilter === filter;
                                const filterLabel =
                                    filter === "volks"
                                        ? intl.formatMessage({ id: "infoPanel.finishers.filter.volks" })
                                        : intl.formatMessage({ id: "infoPanel.finishers.filter.olympisch" });
                                return (
                                    <Button
                                        key={filter}
                                        onClick={() => onSelectFilter(filter)}
                                        className="tracker-info-filter-button"
                                        data-active={isActive}
                                        px="4"
                                        py="2"
                                        h="auto"
                                        borderWidth="1px"
                                        borderColor={isActive ? "#003366" : "#ccc"}
                                        borderRadius="6px"
                                        bg={isActive ? "#003366" : "white"}
                                        color={isActive ? "white" : "black"}
                                        _hover={{ bg: isActive ? "#002a52" : "gray.50" }}
                                    >
                                        {filterLabel}
                                    </Button>
                                );
                            })}
                        </HStack>
                        <Box className="tracker-info-table-wrap tracker-info-finishers-table-wrap" overflowX="auto" px="2" py="2">
                            <Box
                                minW={{ base: "100%", md: "840px" }}
                                display="grid"
                                gridTemplateColumns={{
                                    base: "minmax(126px, 1.5fr) minmax(82px, 1fr) minmax(64px, 0.8fr) minmax(82px, 0.9fr)",
                                    md: "70px minmax(240px, 1.8fr) minmax(130px, 1fr) minmax(110px, 0.8fr) minmax(150px, 1fr)"
                                }}
                                columnGap={{ base: "8px", md: "30px" }}
                                rowGap="12px"
                                alignItems="center"
                                justifyItems="center"
                                justifyContent="center"
                            >
                                <Text fontWeight="bold" color="#1f3c5e" textAlign="center" display={{ base: "none", md: "block" }}>
                                    {intl.formatMessage({ id: "infoPanel.finishers.col.rank" })}
                                </Text>
                                <Text fontWeight="bold" color="#1f3c5e" textAlign="center">
                                    {intl.formatMessage({ id: "infoPanel.finishers.col.name" })}
                                </Text>
                                <Text fontWeight="bold" color="#1f3c5e" textAlign="center">
                                    {intl.formatMessage({ id: "infoPanel.finishers.col.bestTime" })}
                                </Text>
                                <Text fontWeight="bold" color="#1f3c5e" textAlign="center">
                                    {intl.formatMessage({ id: "infoPanel.finishers.col.year" })}
                                </Text>
                                <Text fontWeight="bold" color="#1f3c5e" textAlign="center">
                                    <Box as="span" display={{ base: "none", md: "inline" }}>
                                        {intl.formatMessage({ id: "infoPanel.finishers.col.participations" })}
                                    </Box>
                                    <Box as="span" display={{ base: "inline", md: "none" }}>
                                        {intl.formatMessage({ id: "infoPanel.finishers.col.participationsShort" })}
                                    </Box>
                                </Text>

                                {filteredFinishers.length === 0 ? (
                                    <Text gridColumn="1 / -1" textAlign="center" color="#4f647a">
                                        {intl.formatMessage({ id: "infoPanel.finishers.noResults" })}
                                    </Text>
                                ) : (
                                    filteredFinishers.flatMap((entry, index) => [
                                        <Text key={`${entry.name}-${entry.year}-rank`} fontWeight="bold" textAlign="center" display={{ base: "none", md: "block" }}>
                                            {index + 1}
                                        </Text>,
                                        <Text key={`${entry.name}-${entry.year}-name`} fontWeight="bold" textAlign="center">
                                            {entry.name}
                                        </Text>,
                                        entry.finishTime ? (
                                            <Text key={`${entry.name}-${entry.year}-zeit`} textAlign="center">
                                                {entry.finishTime}
                                            </Text>
                                        ) : (
                                            <Box key={`${entry.name}-${entry.year}-zeit`} display="flex" justifyContent="center" alignItems="center">
                                                <Text
                                                    fontSize="11px"
                                                    fontWeight="bold"
                                                    color="red.700"
                                                    bg="red.50"
                                                    border="1px solid"
                                                    borderColor="red.200"
                                                    px="2"
                                                    py="0.5"
                                                    borderRadius="4px"
                                                    letterSpacing="0.05em"
                                                >
                                                    {intl.formatMessage({ id: "infoPanel.finishers.dnf" })}
                                                </Text>
                                            </Box>
                                        ),
                                        <Text key={`${entry.name}-${entry.year}-year`} textAlign="center">
                                            {entry.year}
                                        </Text>,
                                        <Text key={`${entry.name}-${entry.year}-teilnahmen`} textAlign="center">
                                            {entry.teilnahmen}
                                        </Text>
                                    ])
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}
            </VStack>
        </Box>
    );
}

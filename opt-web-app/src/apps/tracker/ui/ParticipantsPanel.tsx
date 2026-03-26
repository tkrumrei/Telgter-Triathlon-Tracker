// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Button, HStack, IconButton, Input, Text, VStack } from "@chakra-ui/react";
import { useMemo, useState } from "react";

export interface PanelParticipant {
    id: string;
    name: string;
    distanz: string;
    lastUpdatedTs: number;
}

interface ParticipantsPanelProps {
    isOpen: boolean;
    participants: PanelParticipant[];
    followedParticipantId: string | null;
    onOpen: () => void;
    onClose: () => void;
    onFollowParticipant: (participantId: string) => void;
    onStopFollowing: () => void;
}

function formatLastUpdated(lastUpdatedTs: number): string {
    const deltaSeconds = Math.max(0, Math.floor((Date.now() - lastUpdatedTs) / 1000));
    if (deltaSeconds < 60) {
        return `vor ${deltaSeconds}s`;
    }

    const deltaMinutes = Math.floor(deltaSeconds / 60);
    return `vor ${deltaMinutes}m`;
}

function formatDistanceLabel(distanzRaw: string): string {
    const normalized = distanzRaw.trim().toLowerCase();

    if (normalized === "v" || normalized.includes("volks")) {
        return "Volks";
    }

    if (normalized === "o" || normalized.includes("olymp")) {
        return "Olymp";
    }

    return distanzRaw;
}

export function ParticipantsPanel(props: ParticipantsPanelProps) {
    const {
        isOpen,
        participants,
        followedParticipantId,
        onOpen,
        onClose,
        onFollowParticipant,
        onStopFollowing
    } = props;
    const [participantSearch, setParticipantSearch] = useState("");

    const filteredParticipants = useMemo(() => {
        const normalizedSearch = participantSearch.trim().toLowerCase();
        if (!normalizedSearch) {
            return participants;
        }

        return participants.filter((participant) =>
            participant.name.toLowerCase().includes(normalizedSearch)
        );
    }, [participants, participantSearch]);

    const followedParticipantName = useMemo(() => {
        if (!followedParticipantId) {
            return null;
        }

        return participants.find((participant) => participant.id === followedParticipantId)?.name ?? null;
    }, [followedParticipantId, participants]);

    if (!isOpen) {
        return (
            <IconButton
                aria-label="Teilnehmer-Panel öffnen"
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
                    <circle cx="10" cy="7" r="3" stroke="#1f2a36" strokeWidth="2" fill="none" />
                    <path d="M4 17c0-2.6 2.7-4 6-4s6 1.4 6 4" stroke="#1f2a36" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
            </IconButton>
        );
    }

    return (
        <VStack
            align="stretch"
            gap="2"
            p="3"
            bg="rgba(255,255,255,0.95)"
            borderRadius="12px"
            boxShadow="0 4px 12px rgba(0,0,0,0.15)"
            w="240px"
        >
            <HStack justify="space-between" gap="2">
                <Text fontWeight="bold" fontSize="15px" color="#1f2a36">
                    Teilnehmer ({participants.length})
                </Text>
                <IconButton
                    aria-label="Teilnehmer-Panel schließen"
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
                        <line x1="5" y1="5" x2="15" y2="15" stroke="#1f2a36" strokeWidth="2" strokeLinecap="round" />
                        <line x1="15" y1="5" x2="5" y2="15" stroke="#1f2a36" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </IconButton>
            </HStack>

            {followedParticipantName && (
                <Text fontSize="12px" color="#556" px="1">
                    Folge aktiv: {followedParticipantName}
                </Text>
            )}

            <Input
                size="sm"
                placeholder="Teilnehmer suchen..."
                value={participantSearch}
                onChange={(event) => setParticipantSearch(event.target.value)}
                bg="white"
                borderColor="#d6dce2"
            />

            <Box maxH="220px" overflowY="auto" pr="1">
                <VStack align="stretch" gap="1.5">
                    {filteredParticipants.length === 0 ? (
                        <Text fontSize="12px" color="#556" p="2">
                            Keine aktiven Teilnehmer gefunden.
                        </Text>
                    ) : (
                        filteredParticipants.map((participant) => {
                            const isFollowed = participant.id === followedParticipantId;

                            return (
                                <HStack
                                    key={participant.id}
                                    justify="space-between"
                                    align="center"
                                    p="2"
                                    bg="white"
                                    borderRadius="6px"
                                    borderWidth="1px"
                                    borderColor={isFollowed ? "#003366" : "#dfe5eb"}
                                >
                                    <VStack align="start" gap="0" minW="0">
                                        <Text fontSize="12px" fontWeight="bold" color="#223" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                                            {participant.name}
                                        </Text>
                                        <Text fontSize="11px" color="#667">
                                            {formatDistanceLabel(participant.distanz)} · {formatLastUpdated(participant.lastUpdatedTs)}
                                        </Text>
                                    </VStack>

                                    <Button
                                        size="xs"
                                        minW={isFollowed ? "28px" : "auto"}
                                        borderWidth="1px"
                                        borderColor={isFollowed ? "#003366" : "#cfd6dd"}
                                        bg={isFollowed ? "#003366" : "white"}
                                        color={isFollowed ? "white" : "#1f2a36"}
                                        _hover={{ bg: isFollowed ? "#002a52" : "gray.50" }}
                                        onClick={() => {
                                            if (isFollowed) {
                                                onStopFollowing();
                                                return;
                                            }
                                            onFollowParticipant(participant.id);
                                        }}
                                    >
                                        {isFollowed ? "✕" : "Folgen"}
                                    </Button>
                                </HStack>
                            );
                        })
                    )}
                </VStack>
            </Box>
        </VStack>
    );
}

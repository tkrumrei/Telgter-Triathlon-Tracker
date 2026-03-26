// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Flex, Image, Text } from "@chakra-ui/react";

interface TrackerHeaderProps {
    title?: string;
}

export function TrackerHeader(props: TrackerHeaderProps) {
    const title = props.title ?? "Triathlon Tracker";

    return (
        <Flex
            h="8vh"
            minH="56px"
            maxH="110px"
            className="tracker-header"
            bg="#003366"
            color="white"
            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
            align="center"
            justify="center"
            zIndex={2000}
            position="relative"
            px="3"
        >
            <Text
                className="tracker-header-title"
                fontSize="clamp(16px, 2.6vh, 28px)"
                lineHeight="1"
                fontWeight="bold"
                maxW="calc(100% - 150px)"
                textAlign="center"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
            >
                {title}
            </Text>

            <Image
                src="./Logo_Telgter_Triathlon.png"
                alt="Telgter Triathlon Logo"
                h={{ base: "70%", md: "80%" }}
                w="auto"
                objectFit="contain"
                borderRadius="12px"
                position="absolute"
                right={{ base: "8px", md: "12px" }}
                top="50%"
                transform="translateY(-50%)"
            />
        </Flex>
    );
}

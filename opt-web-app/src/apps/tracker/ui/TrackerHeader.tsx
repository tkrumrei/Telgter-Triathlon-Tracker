// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Flex, Image, Text } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";

interface TrackerHeaderProps {
    title?: string;
}

export function TrackerHeader(props: TrackerHeaderProps) {
    const intl = useIntl();
    const title = props.title ?? intl.formatMessage({ id: "header.title" });

    return (
        <Flex
            h="8vh"
            minH="56px"
            maxH="110px"
            className="tracker-header"
            bg="linear-gradient(90deg, #003366 0%, #003366 72%, #0f4c84 100%)"
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
                alt={intl.formatMessage({ id: "header.logoAlt" })}
                h={{ base: "80%", md: "90%" }}
                w="auto"
                objectFit="contain"
                position="absolute"
                right={{ base: "8px", md: "12px" }}
                top="50%"
                transform="translateY(-50%)"
                filter="drop-shadow(0 5px 8px rgba(255, 255, 255, 0.92)) drop-shadow(0 2px 5px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 30px rgba(255, 255, 255, 0.72))"
            />
        </Flex>
    );
}

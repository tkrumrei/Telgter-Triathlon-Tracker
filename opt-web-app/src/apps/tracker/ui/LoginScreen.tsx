// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Button, Flex, Heading, Image, Input, Text, VStack } from "@chakra-ui/react";
import type { KeyboardEvent } from "react";

interface LoginScreenProps {
    inputCode: string;
    errorMsg: string;
    onCodeChange: (value: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onLogin: () => void;
}

export function LoginScreen(props: LoginScreenProps) {
    const { inputCode, errorMsg, onCodeChange, onKeyDown, onLogin } = props;

    return (
        <Flex className="tracker-login-root" direction="column" w="100%" h="100%" bg="#f4f6f8">
            <Box
                className="tracker-login-header"
                bg="#003366"
                color="white"
                boxShadow="0 2px 10px rgba(0,0,0,0.1)"
                py="6"
                textAlign="center"
            >
                <Heading m="0" size="lg" fontWeight="bold">
                    3. Telgter Triathlon
                </Heading>
            </Box>

            <Flex className="tracker-login-center" flex="1" align="center" justify="center" px="4">
                <VStack
                    className="tracker-login-card"
                    w="90%"
                    maxW="400px"
                    bg="white"
                    p="10"
                    textAlign="center"
                    gap="4"
                >
                    <Image
                        src="/Logo_Telgter_Triathlon.png"
                        alt="Telgter Triathlon Logo"
                        h="100px"
                        w="auto"
                        objectFit="contain"
                    />

                    <Heading className="tracker-login-title" size="md">
                        Event Zugang
                    </Heading>

                    <Input
                        className="tracker-login-input"
                        type="text"
                        placeholder="Code..."
                        value={inputCode}
                        onChange={(e) => onCodeChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        size="lg"
                    />

                    <Button onClick={onLogin} w="100%" size="lg" className="tracker-login-button">
                        Starten
                    </Button>

                    {errorMsg && <Text className="tracker-login-error">{errorMsg}</Text>}
                </VStack>
            </Flex>
        </Flex>
    );
}

// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./AppUI";
import "./app.css";

// Erstellt das HTML Element <triathlon-tracker-app>
const Element = createCustomElement({
    component: AppUI,
    appMetadata,
    resolveConfig() {
        const lang = new URLSearchParams(window.location.search).get("lang");
        return Promise.resolve(lang ? { locale: lang } : undefined);
    }
});

customElements.define("triathlon-tracker-app", Element);

// Sobald die Seite lädt, fügen wir das Element in den Body ein
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("app");
    if (container) {
        const appElement = document.createElement("triathlon-tracker-app");
        // Style damit es 100% füllt
        appElement.style.height = "100%";
        appElement.style.width = "100%";
        appElement.style.display = "block";
        container.appendChild(appElement);
    }
});

import { __awaiter } from "tslib";
import { EnvironmentMode, FakeLocationService, FakeResourceGroupService, FakeStorageAccountService, FakeSubscriptionService, initEnvironment, } from "@azure/bonito-core";
import { StandardClock } from "@azure/bonito-core/lib/datetime";
import { DependencyName } from "@azure/bonito-core/lib/environment";
import { MockHttpClient } from "@azure/bonito-core/lib/http";
import { HttpLocalizer } from "@azure/bonito-core/lib/localization";
import { createConsoleLogger } from "@azure/bonito-core/lib/logging";
import { AlertNotifier } from "@azure/bonito-core/lib/notification/alert-notifier";
import { DefaultBrowserEnvironment } from "@azure/bonito-ui";
import { DefaultFormLayoutProvider } from "@azure/bonito-ui/lib/components/form";
import { BrowserDependencyName, } from "@azure/bonito-ui/lib/environment";
import { BatchFormControlResolver, } from "@batch/ui-react";
import { FakeNodeService } from "@batch/ui-service";
import { BatchDependencyName } from "@batch/ui-service/lib/environment";
import { FakePoolService } from "@batch/ui-service/lib/pool";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Application } from "./components";
import { MemoryCacheManager } from "@azure/bonito-core/lib/cache";
import { FakeAccountService } from "@batch/ui-service/lib/account";
// Bootstrap the app
const rootEl = document.getElementById("batch-explorer-root");
if (!rootEl) {
    throw new Error("Failed to initialize: No element with an ID of 'batch-explorer-root' found.");
}
init(rootEl);
export function init(rootEl) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const localizer = new HttpLocalizer();
        yield localizer.loadTranslations("/resources/i18n");
        initEnvironment(new DefaultBrowserEnvironment({
            mode: (_a = ENV.MODE) !== null && _a !== void 0 ? _a : EnvironmentMode.Development,
            armUrl: "https://management.azure.com",
        }, {
            [DependencyName.Clock]: () => new StandardClock(),
            [DependencyName.LoggerFactory]: () => createConsoleLogger,
            [DependencyName.Localizer]: () => localizer,
            [DependencyName.HttpClient]: () => new MockHttpClient(),
            [DependencyName.LocationService]: () => new FakeLocationService(),
            [DependencyName.Notifier]: () => new AlertNotifier(),
            [DependencyName.CacheManager]: () => new MemoryCacheManager(),
            [BatchDependencyName.PoolService]: () => new FakePoolService(),
            [BatchDependencyName.NodeService]: () => new FakeNodeService(),
            [BatchDependencyName.AccountService]: () => new FakeAccountService(),
            [DependencyName.ResourceGroupService]: () => new FakeResourceGroupService(),
            [DependencyName.StorageAccountService]: () => new FakeStorageAccountService(),
            [DependencyName.SubscriptionService]: () => new FakeSubscriptionService(),
            [BrowserDependencyName.FormControlResolver]: () => new BatchFormControlResolver(),
            [BrowserDependencyName.FormLayoutProvider]: () => new DefaultFormLayoutProvider(),
        }));
        ReactDOM.render(React.createElement(Application, null), rootEl);
    });
}
//# sourceMappingURL=index.js.map
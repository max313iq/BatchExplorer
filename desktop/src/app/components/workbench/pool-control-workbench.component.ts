import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, Optional } from "@angular/core";
import { UserConfigurationService } from "@batch-flask/core";
import { ListSelection } from "@batch-flask/core/list";
import { TableConfig } from "@batch-flask/ui";
import { BEUserConfiguration } from "common";
import { Observable, Subject, Subscription, firstValueFrom, timer } from "rxjs";
import { takeUntil } from "rxjs/operators";

interface WorkbenchPoolRow {
    uid: string;
    subscriptionId: string;
    accountName: string;
    location: string;
    poolId: string;
    allocationState: string;
    nodeCountsByState: {
        idle: number;
        running: number;
        starting: number;
        startTaskFailed: number;
        unusable: number;
    };
    alerts: string[];
}

interface DiscoveryServiceLike {
    listAccounts: () => Observable<any> | Promise<any> | any;
    listPools: (account: any) => Observable<any> | Promise<any> | any;
}

@Component({
    selector: "bl-pool-control-workbench",
    templateUrl: "pool-control-workbench.html",
    styleUrls: ["pool-control-workbench.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolControlWorkbenchComponent implements OnInit, OnDestroy {
    public static breadcrumb() {
        return { name: "Pool Control Workbench" };
    }

    public tableConfig: TableConfig = {
        id: "pool-control-workbench-table",
        showCheckbox: true,
        sorting: {
            subscriptionId: true,
            accountName: true,
            location: true,
            poolId: true,
            allocationState: true,
        },
    };

    public isFeatureEnabled = false;
    public isRefreshing = false;
    public refreshError: string | null = null;
    public statusMessage = "No data loaded.";

    public activeItem: WorkbenchPoolRow | null = null;
    public selection = new ListSelection();

    public allRows: WorkbenchPoolRow[] = [];
    public displayedRows: WorkbenchPoolRow[] = [];

    public subscriptionFilter = "";
    public accountFilter = "";
    public regionFilter = "";
    public searchFilter = "";
    public onlyAlerts = false;

    public subscriptionOptions: string[] = [];
    public accountOptions: string[] = [];
    public regionOptions: string[] = [];

    public autoRefreshEnabled = false;
    public autoRefreshIntervalSeconds = 30;

    private _autoRefreshSub: Subscription | null = null;
    private _destroy = new Subject<void>();

    constructor(
        private settingsService: UserConfigurationService<BEUserConfiguration>,
        private changeDetector: ChangeDetectorRef,
        @Optional() @Inject("WorkbenchDiscoveryService") private discoveryService: DiscoveryServiceLike | null,
    ) {
    }

    public ngOnInit() {
        this.settingsService.watch("features").pipe(takeUntil(this._destroy)).subscribe((features: any) => {
            this.isFeatureEnabled = Boolean(features && features.poolControlWorkbench);
            this._configureAutoRefresh();
            if (this.isFeatureEnabled && this.displayedRows.length === 0) {
                this.refresh();
            }
            this.changeDetector.markForCheck();
        });

        this.settingsService.watch("poolControlWorkbench").pipe(takeUntil(this._destroy)).subscribe((settings: any) => {
            const refreshSettings = settings && settings.refresh ? settings.refresh : {};
            this.autoRefreshEnabled = Boolean(refreshSettings.autoRefreshEnabled);
            this.autoRefreshIntervalSeconds = this._safeIntervalSeconds(refreshSettings.autoRefreshIntervalSeconds);
            this._configureAutoRefresh();
            this.changeDetector.markForCheck();
        });
    }

    public ngOnDestroy() {
        if (this._autoRefreshSub) {
            this._autoRefreshSub.unsubscribe();
            this._autoRefreshSub = null;
        }
        this._destroy.next();
        this._destroy.complete();
    }

    public get selectedCount(): number {
        return this.selection.all ? this.displayedRows.length : this.selection.keys.size;
    }

    public onAutoRefreshChanged() {
        this._configureAutoRefresh();
    }

    public clearSelection() {
        this.selection.clear();
    }

    public applyFilters() {
        const search = this.searchFilter.trim().toLowerCase();
        this.displayedRows = this.allRows.filter((row) => {
            if (this.subscriptionFilter && row.subscriptionId !== this.subscriptionFilter) {
                return false;
            }
            if (this.accountFilter && row.accountName !== this.accountFilter) {
                return false;
            }
            if (this.regionFilter && row.location !== this.regionFilter) {
                return false;
            }
            if (this.onlyAlerts && row.alerts.length === 0) {
                return false;
            }
            if (search) {
                const haystack = `${row.poolId} ${row.accountName} ${row.location} ${row.subscriptionId}`.toLowerCase();
                if (!haystack.includes(search)) {
                    return false;
                }
            }
            return true;
        });
        this.statusMessage = this.displayedRows.length === 0 ? "No pools match current filters." : "";
    }

    public async refresh() {
        if (this.isRefreshing || !this.isFeatureEnabled) {
            return;
        }

        this.isRefreshing = true;
        this.refreshError = null;
        this.statusMessage = "Refreshing pool inventory...";
        this.changeDetector.markForCheck();

        try {
            if (!this.discoveryService
                || typeof this.discoveryService.listAccounts !== "function"
                || typeof this.discoveryService.listPools !== "function") {
                this.allRows = [];
                this.displayedRows = [];
                this.statusMessage = "Discovery service is unavailable. Waiting for data layer integration.";
                return;
            }

            const accounts = await this._toPromise<any[]>(this.discoveryService.listAccounts());
            const rows: WorkbenchPoolRow[] = [];
            const accountList = Array.isArray(accounts) ? accounts : [];

            for (const account of accountList) {
                const pools = await this._toPromise<any[]>(this.discoveryService.listPools(account));
                const poolList = Array.isArray(pools) ? pools : [];
                for (const pool of poolList) {
                    rows.push(this._mapPoolRow(account, pool));
                }
            }

            this.allRows = rows;
            this._rebuildFilterOptions();
            this.applyFilters();
            if (rows.length > 0) {
                this.statusMessage = "";
            } else if (!this.statusMessage) {
                this.statusMessage = "No pools were discovered.";
            }
        } catch (error) {
            this.refreshError = this._describeError(error);
            this.statusMessage = "Refresh failed.";
        } finally {
            this.isRefreshing = false;
            this.changeDetector.markForCheck();
        }
    }

    private _configureAutoRefresh() {
        if (this._autoRefreshSub) {
            this._autoRefreshSub.unsubscribe();
            this._autoRefreshSub = null;
        }

        if (!this.isFeatureEnabled || !this.autoRefreshEnabled) {
            return;
        }

        this._autoRefreshSub = timer(this.autoRefreshIntervalSeconds * 1000, this.autoRefreshIntervalSeconds * 1000)
            .pipe(takeUntil(this._destroy))
            .subscribe(() => {
                this.refresh();
            });
    }

    private _safeIntervalSeconds(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
    }

    private _rebuildFilterOptions() {
        this.subscriptionOptions = this._sortedUnique(this.allRows.map(x => x.subscriptionId));
        this.accountOptions = this._sortedUnique(this.allRows.map(x => x.accountName));
        this.regionOptions = this._sortedUnique(this.allRows.map(x => x.location));
    }

    private _sortedUnique(values: string[]): string[] {
        return [...new Set(values.filter(x => Boolean(x)))].sort((a, b) => a.localeCompare(b));
    }

    private _mapPoolRow(account: any, pool: any): WorkbenchPoolRow {
        const subscriptionId = this._pick(account, ["subscriptionId", "subscription.id", "subscription.subscriptionId"], "unknown-subscription");
        const accountName = this._pick(account, ["accountName", "displayName", "name"], "unknown-account");
        const location = this._pick(account, ["location", "region"], "unknown-region");
        const poolId = this._pick(pool, ["poolId", "id"], "unknown-pool");
        const allocationState = this._pick(pool, ["allocationState"], "unknown");
        const nodeCounts = pool && pool.nodeCountsByState ? pool.nodeCountsByState : {};
        const alerts = Array.isArray(pool && pool.alerts) ? pool.alerts : [];

        return {
            uid: `${subscriptionId}|${accountName}|${poolId}`,
            subscriptionId,
            accountName,
            location,
            poolId,
            allocationState,
            nodeCountsByState: {
                idle: this._asNumber(nodeCounts.idle),
                running: this._asNumber(nodeCounts.running),
                starting: this._asNumber(nodeCounts.starting),
                startTaskFailed: this._asNumber(nodeCounts.startTaskFailed),
                unusable: this._asNumber(nodeCounts.unusable),
            },
            alerts,
        };
    }

    private _asNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }

    private _pick(source: any, paths: string[], fallback: string): string {
        for (const path of paths) {
            let current = source;
            const segments = path.split(".");
            for (const segment of segments) {
                current = current && current[segment];
            }
            if (typeof current === "string" && current.trim().length > 0) {
                return current;
            }
        }
        return fallback;
    }

    private _describeError(error: any): string {
        if (!error) {
            return "Unknown refresh error";
        }
        if (typeof error === "string") {
            return error;
        }
        if (error.message) {
            return error.message;
        }
        return "Unknown refresh error";
    }

    private _toPromise<T>(value: T | Promise<T> | Observable<T>): Promise<T> {
        if (value && typeof (value as any).subscribe === "function") {
            return firstValueFrom(value as Observable<T>);
        }
        if (value && typeof (value as any).then === "function") {
            return value as Promise<T>;
        }
        return Promise.resolve(value as T);
    }
}

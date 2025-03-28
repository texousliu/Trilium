import server from "../../../services/server.js";
import toastService from "../../../services/toast.js";
import OptionsWidget from "./options_widget.js";
import type { OptionMap } from "../../../../../services/options_interface.js";
import { t } from "../../../services/i18n.js";
import utils from "../../../services/utils.js";

const TPL_WEB = `
<div class="options-section">
    <h4>${t("multi_factor_authentication.title")}</h4>
    <p class="form-text">${t("multi_factor_authentication.description")}</p>

    <div class="col-md-6 side-checkbox">
        <label class="form-check tn-checkbox">
            <input type="checkbox" class="mfa-enabled-checkbox form-check-input" />
            ${t("multi_factor_authentication.mfa_enabled")}
        </label>
    </div>

    <hr />

    <div class="mfa-options" style="display: none;">
        <label class="form-label"><b>${t("multi_factor_authentication.mfa_method")}</b></label>
        <div role="group">
            <label class="tn-radio">
                <input class="mfa-method-radio" type="radio" name="mfaMethod" value="totp" />
                <b>${t("multi_factor_authentication.totp_title")}</b>
            </label>
            <label class="tn-radio">
                <input class="mfa-method-radio" type="radio" name="mfaMethod" value="oauth" />
                <b>${t("multi_factor_authentication.oauth_title")}</b>
            </label>
        </div>

        <div class="totp-options" style="display: none;">
            <p class="form-text">${t("multi_factor_authentication.totp_description")}</p>

            <hr />

            <h5>${t("multi_factor_authentication.totp_secret_title")}</h5>
            <br />
            <button class="generate-totp btn btn-primary">
                ${t("multi_factor_authentication.totp_secret_generate")}
            </button>

            <hr />

            <h5>${t("multi_factor_authentication.recovery_keys_title")}</h5>
            <p class="form-text">${t("multi_factor_authentication.recovery_keys_description")}</p>

            <div class="alert alert-warning" role="alert" style="font-weight: bold; color: red !important;">
                ${t("multi_factor_authentication.recovery_keys_description_warning")}
            </div>

            <br>

            <table style="border: 0px solid white">
                <tbody>
                    <tr>
                        <td class="key_0"></td>
                        <td style="width: 20px" />
                        <td class="key_1"></td>
                    </tr>
                    <tr>
                        <td class="key_2"></td>
                        <td />
                        <td class="key_3"></td>
                    </tr>
                    <tr>
                        <td class="key_4"></td>
                        <td />
                        <td class="key_5"></td>
                    </tr>
                    <tr>
                        <td class="key_6"></td>
                        <td />
                        <td class="key_7"></td>
                    </tr>
                </tbody>
            </table>

            <br>

            <button class="generate-recovery-code btn btn-primary"> ${t("multi_factor_authentication.recovery_keys_generate")} </button>
        </div>

        <div class="oauth-options" style="display: none;">
            <div class="col-md-6">
                <span><b>${t("multi_factor_authentication.oauth_user_account")}</b></span><span class="user-account-name"> ${t("multi_factor_authentication.oauth_user_not_logged_in")}</span>
                <br>
                <span><b>${t("multi_factor_authentication.oauth_user_email")}</b></span><span class="user-account-email"> ${t("multi_factor_authentication.oauth_user_not_logged_in")}</span>
            </div>

            <p class="form-text">${t("multi_factor_authentication.oauth_description")}</p>
        </div>
    </div>
</div>
`;

const TPL_ELECTRON = `
<div class="options-section">
    <h4>${t("multi_factor_authentication.title")}</h4>
    <p class="form-text">${t("multi_factor_authentication.electron_disabled")}</p>
</div>
`;

interface OAuthStatus {
    enabled: boolean;
    name?: string;
    email?: string;
}

interface TOTPStatus {
    set: boolean;
    message: boolean;
}

interface RecoveryKeysResponse {
    success: boolean;
    recoveryCodes?: string;
    keysExist?: boolean;
    usedRecoveryCodes?: string;
}

export default class MultiFactorAuthenticationOptions extends OptionsWidget {
    private $generateTotpButton!: JQuery<HTMLElement>;
    private $totpSecret!: JQuery<HTMLElement>;
    private $generateRecoveryCodeButton!: JQuery<HTMLElement>;
    private $UserAccountName!: JQuery<HTMLElement>;
    private $UserAccountEmail!: JQuery<HTMLElement>;
    private $envEnabledTOTP!: JQuery<HTMLElement>;
    private $envEnabledOAuth!: JQuery<HTMLElement>;
    private $recoveryKeys: JQuery<HTMLElement>[] = [];
    private $protectedSessionTimeout!: JQuery<HTMLElement>;
    private $mfaEnabledCheckbox!: JQuery<HTMLElement>;
    private $mfaOptions!: JQuery<HTMLElement>;
    private $mfaMethodRadios!: JQuery<HTMLElement>;
    private $totpOptions!: JQuery<HTMLElement>;
    private $oauthOptions!: JQuery<HTMLElement>;

    doRender() {
        const template = utils.isElectron() ? TPL_ELECTRON : TPL_WEB;
        this.$widget = $(template);

        if (!utils.isElectron()) {
            this.$mfaEnabledCheckbox = this.$widget.find(".mfa-enabled-checkbox");
            this.$mfaOptions = this.$widget.find(".mfa-options");
            this.$mfaMethodRadios = this.$widget.find(".mfa-method-radio");
            this.$totpOptions = this.$widget.find(".totp-options");
            this.$oauthOptions = this.$widget.find(".oauth-options");

            this.$generateTotpButton = this.$widget.find(".generate-totp");
            this.$totpSecret = this.$widget.find(".totp-secret");
            this.$generateRecoveryCodeButton = this.$widget.find(".generate-recovery-code");
            this.$UserAccountName = this.$widget.find(".user-account-name");
            this.$UserAccountEmail = this.$widget.find(".user-account-email");
            this.$envEnabledTOTP = this.$widget.find(".env-totp-enabled");
            this.$envEnabledOAuth = this.$widget.find(".env-oauth-enabled");

            this.$recoveryKeys = [];
            for (let i = 0; i < 8; i++) {
                this.$recoveryKeys.push(this.$widget.find(".key_" + i));
            }

            this.$generateRecoveryCodeButton.on("click", async () => {
                await this.setRecoveryKeys();
            });

            this.$generateTotpButton.on("click", async () => {
                await this.generateKey();
            });

            this.$protectedSessionTimeout = this.$widget.find(".protected-session-timeout-in-seconds");
            this.$protectedSessionTimeout.on("change", () => {
                this.updateOption("protectedSessionTimeout", this.$protectedSessionTimeout.val());
            });

            this.displayRecoveryKeys();

            this.$mfaEnabledCheckbox.on("change", () => {
                const isChecked = this.$mfaEnabledCheckbox.is(":checked");
                this.$mfaOptions.toggle(isChecked);
                if (!isChecked) {
                    this.$totpOptions.hide();
                    this.$oauthOptions.hide();
                } else {
                    this.$mfaMethodRadios.filter('[value="totp"]').prop("checked", true);
                    this.$totpOptions.show();
                    this.$oauthOptions.hide();
                }
                this.updateCheckboxOption("mfaEnabled", this.$mfaEnabledCheckbox);
            });

            this.$mfaMethodRadios.on("change", () => {
                const selectedMethod = this.$mfaMethodRadios.filter(":checked").val();
                this.$totpOptions.toggle(selectedMethod === "totp");
                this.$oauthOptions.toggle(selectedMethod === "oauth");
                this.updateOption("mfaMethod", selectedMethod);
            });
        }
    }

    async setRecoveryKeys() {
        const result = await server.get<RecoveryKeysResponse>("totp_recovery/generate");
        if (!result.success) {
            toastService.showError(t("multi_factor_authentication.recovery_keys_error"));
            return;
        }
        if (result.recoveryCodes) {
            this.keyFiller(result.recoveryCodes);
            await server.post("totp_recovery/set", {
                recoveryCodes: result.recoveryCodes,
            });
        }
    }

    async displayRecoveryKeys() {
        const result = await server.get<RecoveryKeysResponse>("totp_recovery/enabled");
        if (!result.success) {
            this.fillKeys(t("multi_factor_authentication.recovery_keys_error"));
            return;
        }

        if (!result.keysExist) {
            this.fillKeys(t("multi_factor_authentication.recovery_keys_no_key_set"));
            this.$generateRecoveryCodeButton.text(t("multi_factor_authentication.recovery_keys_generate"));
            return;
        }

        const usedResult = await server.get<RecoveryKeysResponse>("totp_recovery/used");
        if (usedResult.usedRecoveryCodes) {
            this.keyFiller(usedResult.usedRecoveryCodes);
            this.$generateRecoveryCodeButton.text(t("multi_factor_authentication.recovery_keys_regenerate"));
        } else {
            this.fillKeys(t("multi_factor_authentication.recovery_keys_no_key_set"));
        }
    }

    private keyFiller(values: string) {
        const keys = values.split(',').slice(0, 8);

        this.fillKeys("");

        keys.forEach((key, index) => {
            if (index < 8 && key && typeof key === 'string') {
                this.$recoveryKeys[index].text(key.trim());
            }
        });
    }

    private fillKeys(message: string) {
        for (let i = 0; i < 8; i++) {
            this.$recoveryKeys[i].text(message);
        }
    }

    async generateKey() {
        const result = await server.get<{ success: boolean; message: string }>("totp/generate");
        if (result.success) {
            this.$totpSecret.text(result.message);
        } else {
            toastService.showError(result.message);
        }
    }

    optionsLoaded(options: OptionMap) {
        if (!utils.isElectron()) {
            this.$mfaEnabledCheckbox.prop("checked", options.mfaEnabled === "true");

            this.$mfaOptions.toggle(options.mfaEnabled === "true");
            if (options.mfaEnabled === "true") {
                const savedMethod = options.mfaMethod || "totp";
                this.$mfaMethodRadios.filter(`[value="${savedMethod}"]`).prop("checked", true);
                this.$totpOptions.toggle(savedMethod === "totp");
                this.$oauthOptions.toggle(savedMethod === "oauth");
            } else {
                this.$totpOptions.hide();
                this.$oauthOptions.hide();
            }

            // server.get<OAuthStatus>("oauth/status").then((result) => {
            //     if (result.enabled) {
            //         if (result.name) this.$UserAccountName.text(result.name);
            //         if (result.email) this.$UserAccountEmail.text(result.email);

            //         this.$envEnabledOAuth.hide();
            //     } else {
            //         this.$envEnabledOAuth.text(t("multi_factor_authentication.oauth_enable_description"));
            //         this.$envEnabledOAuth.show();
            //     }
            // });

            server.get<TOTPStatus>("totp/status").then((result) => {
                if (result.set) {
                    this.$generateTotpButton.text(t("multi_factor_authentication.totp_secret_regenerate"));
                }
            });
            this.$protectedSessionTimeout.val(Number(options.protectedSessionTimeout));
        }
    }
}

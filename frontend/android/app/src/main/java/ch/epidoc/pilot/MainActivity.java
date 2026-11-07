package ch.epidoc.pilot;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.autofill.AutofillManager;
import android.webkit.WebView;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;
import java.util.Collections;

public class MainActivity extends BridgeActivity {
    private boolean documentStartScriptAdded = false;

    /**
     * Nur Passkeys/WebAuthn abschalten. Formulare nicht anfassen,
     * sonst bricht der React-Login auf der Website.
     */
    private static final String DISABLE_PASSKEYS_JS =
        "(function(){"
            + "try{"
            + "if(location&&location.pathname&&(location.pathname==='/login'||location.pathname.indexOf('/login')===0)){"
            + "localStorage.removeItem('auth_token_data');"
            + "}"
            + "if(navigator.credentials){"
            + "var blocked=function(){return Promise.reject(new DOMException('disabled','NotAllowedError'));};"
            + "navigator.credentials.get=blocked;"
            + "navigator.credentials.create=blocked;"
            + "}"
            + "if(window.PublicKeyCredential){"
            + "PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable=function(){return Promise.resolve(false);};"
            + "if(PublicKeyCredential.isConditionalMediationAvailable){"
            + "PublicKeyCredential.isConditionalMediationAvailable=function(){return Promise.resolve(false);};"
            + "}"
            + "}"
            + "}catch(e){}"
            + "})();";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        disableAutofillAndPasskeys();
    }

    @Override
    public void onResume() {
        super.onResume();
        disableAutofillAndPasskeys();
    }

    private void disableAutofillAndPasskeys() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            View content = findViewById(android.R.id.content);
            if (content != null) {
                content.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
            }
        }

        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        WebView webView = getBridge().getWebView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
            webView.getSettings().setSaveFormData(false);
        }

        if (!documentStartScriptAdded
                && WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(
                webView,
                DISABLE_PASSKEYS_JS,
                Collections.singleton("*")
            );
            documentStartScriptAdded = true;
        } else if (!documentStartScriptAdded) {
            webView.evaluateJavascript(DISABLE_PASSKEYS_JS, null);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AutofillManager autofillManager = getSystemService(AutofillManager.class);
            if (autofillManager != null) {
                autofillManager.cancel();
            }
        }
    }
}

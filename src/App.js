import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@emotion/react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";

import i18n from "./i18n/i18n";
import Backups from "./presentation/Backups";
import AllRoutes from "./routes";
import theme from "./shared/theme";
import store from "./store";
import { NotificationsProvider } from "./utils/NotificationsContext";

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <I18nextProvider i18n={i18n}>
            <BrowserRouter>
              {/* One notification engine feeds the bell and the sidebar. */}
              <NotificationsProvider>
                <Toaster position="top-right" />
                <CssBaseline />
                <AllRoutes />
                <Backups />
              </NotificationsProvider>
            </BrowserRouter>
          </I18nextProvider>
        </ThemeProvider>
      </Provider>
    </div>
  );
}

export default App;

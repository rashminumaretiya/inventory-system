import { BrowserRouter } from "react-router-dom";
import AllRoutes from "./routes";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@emotion/react";
import theme from "./shared/theme";
import { CssBaseline } from "@mui/material";
import { Provider } from "react-redux";
import store from "./store";
import Backups from "./presentation/Backups";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/i18n";

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <I18nextProvider i18n={i18n}>
            <BrowserRouter>
              <Toaster />
              <CssBaseline />
              <AllRoutes />
              <Backups />
            </BrowserRouter>
          </I18nextProvider>
        </ThemeProvider>
      </Provider>
    </div>
  );
}

export default App;

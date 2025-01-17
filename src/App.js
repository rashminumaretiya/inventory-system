import { BrowserRouter } from "react-router-dom";
import AllRoutes from "./routes";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@emotion/react";
import theme from "./shared/theme";
import { CssBaseline } from "@mui/material";
import { Provider } from "react-redux";
import store from "./store";

function App() {
  return (
    <div className="App">
      <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Toaster />
          <CssBaseline />
          <AllRoutes />
        </BrowserRouter>
      </ThemeProvider>
      </Provider>
    </div>
  );
}

export default App;

import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import { Toaster } from "sonner"
import ControlLayout from "./layouts/ControlLayout"
import AuthButton from "./components/global/AuthButton"
import Widget from "./components/global/Widgets"
import "./App.css"

const client = new QueryClient()

function App() {

  return (
    <QueryClientProvider client={client}>
      <ControlLayout className="app-shell">
        <AuthButton />
        <Widget />
      </ControlLayout>
      <Toaster/>
    </QueryClientProvider>
  )
}

export default App

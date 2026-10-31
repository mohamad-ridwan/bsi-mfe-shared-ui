import { createBrowserRouter } from "react-router-dom";
import TransactionFormDemoPage from "../pages/demo/transaction-form/TransactionFormDemoPage";

const router = createBrowserRouter([
  {
    path: "/demo/form/transaction-form",
    element: <TransactionFormDemoPage />,
  },
]);

export default router;

import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import FloatingChatButton from "./components/FloatingChatButton.jsx";
import HomePage from "./pages/HomePage.jsx";

function WithNavbar({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Home Page */}
        <Route
          path="/"
          element={
            <WithNavbar>
              <HomePage />
            </WithNavbar>
          }
        />

        {/* Redirect unknown routes to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Floating chat button — visible on all pages */}
      <FloatingChatButton />
    </>
  );
}

// import { useState } from "react";

// const App = () => {
//   const [count, setCount] = useState(0);

//   const increment = () => {
//     setCount((prev) => prev + 1);
//   };
//   const decrement = () => {
//     setCount((prev) => prev - 1);
//   };
//   const reset = () => {
//     setCount(0);
//   };

//   return (
//     <div>
//       <h1>{count}</h1>
//       <button onClick={increment}>+</button>
//       <button onClick={reset}>reset</button>
//       <button onClick={decrement}>-</button>
//     </div>
//   );
// };

// export default App;

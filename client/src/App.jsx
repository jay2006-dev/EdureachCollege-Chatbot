// import { Routes, Route, Navigate } from "react-router-dom";
// import Navbar from "./components/Navbar.jsx";
// import FloatingChatButton from "./components/FloatingChatButton.jsx";
// import HomePage from "./pages/HomePage.jsx";

// function WithNavbar({ children }) {
//   return (
//     <>
//       <Navbar />
//       {children}
//     </>
//   );
// }

// export default function App() {
//   return (
//     <>
//       <Routes>
//         <Route path="/" element={<WithNavbar><HomePage /></WithNavbar>} />
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>

//       {/* Floating chat button — visible on all pages */}
//       <FloatingChatButton />
//     </>
//   );
// }

import { useState } from "react";

const App = () => {
  const [counter, setCount] = useState(0);

  function timer(counter) {
    if (counter == 0) {
      return;
    }
    setCount((prev) => prev - 1);

    return timer(counter - 1);
  }

  return (
    <div>
      <input value={counter} onChange={(e) => setCount(e.target.value)} />
      <p>{counter}</p>
      <button onClick={timer(counter)}>Start</button>
    </div>
  );
};

export default App;

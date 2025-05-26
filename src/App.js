import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameInfo from "./pages/gameInfo";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomeScreen";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/games/:id" Component={GameInfo} />
      </Routes>
    </BrowserRouter>
  );
}



export default App;

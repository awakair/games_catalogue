import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameInfo from "./pages/gameInfo";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomeScreen";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route index path="/" Component={HomePage}/>
        <Route path="/games/:id" Component={GameInfo} />
        <Route path="*" Component={NotFound} />
      </Routes>
    </BrowserRouter>
  );
}



export default App;

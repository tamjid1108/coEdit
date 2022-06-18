import TextEditor from "./components/TextEditor";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate  
} from 'react-router-dom';
import { v4 as uuidv4 } from "uuid";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" exact element={<Navigate to={`/document/${uuidv4()}`} />} />
        <Route path="/document/:id" element={ <TextEditor /> } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

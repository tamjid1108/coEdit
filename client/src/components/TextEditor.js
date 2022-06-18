import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const TIME_BETWEEN_SAVE = 2000;    //in milliseconds


//setting up the toolbar for the quill editor
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],        
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

const TextEditor = () => {

    // get the document id from the url as a parameter
  const { id: docID } = useParams();


  // states for the client socket and text editor
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

    // connect to server at "http://localhost:3001"
  useEffect(() => {
    const s = io("http://localhost:3001");
    
    setSocket(s);

    return () => {
      s.disconnect();
    };

  }, []);


    // request document from the server

  useEffect(() => {
    if (socket == null || quill == null) return;

    // set the document from the received document 
    socket.once("load-document", document =>{
        quill.setContents(document);
        quill.enable();

    });

    // send the document id to server 
    socket.emit('request-document', docID);


  }, [socket, quill, docID]);



  useEffect(() => {
    if (socket == null || quill == null) return;

    // send the changes as and when editor content changes
    const changeHandler = (delta, oldDelta, src) => {
      if (src !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", changeHandler);

    return () => {
      quill.off("text-change", changeHandler);
    };

  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const receiveHandler = (delta) => {
      quill.updateContents(delta);
    };

    // update editor contents once changes are received
    socket.on("receive-changes", receiveHandler);

    return () => {
      socket.off("receive-changes", receiveHandler);
    };
  }, [socket, quill]);



  useEffect(()=>{
    if (socket == null || quill == null) return;


    // triggering event to save document in regular interval
    const interval = setInterval(()=>{
        socket.emit('save-document', quill.getContents())
    }, TIME_BETWEEN_SAVE)

    return ()=>{
        clearInterval(interval);
    }
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });
    q.disable();
    q.setText("");
    setQuill(q);
    
  }, []);
  return <div className="container" ref={wrapperRef}></div>;
};

export default TextEditor;

import { useEffect, useRef, useState } from "react";
import { RecordingState, WebsocketManager } from "../audio-lib/WebsocketManager";
import { audioService } from "../services/audioService";

export const useRecordAudio = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDEAL);
  const webSocketManager = useRef<WebsocketManager>();
  const activeSessionRef = useRef<string | null>(null);
  const [audioURL,setAudioURL] = useState('');
  const [audioFile,setAudioFile] = useState('');
  const onError = (status: string, message: string) => {
    console.log({ status, message });
  };

  const onData = (event: string,message: string)=>{
    if(event==='audio-file'){
      setAudioFile(message);
      (async () => {
        try {
          const audioFileUrl = await audioService.getAudioFileUrl(message, 'wav');
          setAudioURL(audioFileUrl);
        } catch (err) {
          console.error('Error saving audio file', err);
        }
      })();
    }
  }
  const stopRecording = () => {
    if (!webSocketManager.current) {
      return;
    }

    webSocketManager.current?.stop();
    webSocketManager.current = undefined;
    activeSessionRef.current = null;
    setRecordingState(RecordingState.IDEAL);
  };
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async (audioFileName: string) => {
    if (webSocketManager.current || activeSessionRef.current) {
      return;
    }

    activeSessionRef.current = audioFileName;
    const websocketInstance = new WebsocketManager();
    websocketInstance.setQueryParams({ audioFileName });
    websocketInstance.setOnError(onError);
    websocketInstance.setOnData(onData);
    websocketInstance.start("");
    webSocketManager.current = websocketInstance;
    setRecordingState(RecordingState.RUNNING);
  };
  const pauseRecording = () => {
    if (webSocketManager.current) {
      webSocketManager.current?.pause();
      setRecordingState(RecordingState.PUASED);

    }
  };
  const resumeRecording = () => {
    if (webSocketManager.current) {
      webSocketManager.current?.resume();
      setRecordingState(RecordingState.RUNNING);
    }
  };
  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    recordingState,
    audioURL,
    audioFile,
  };
};

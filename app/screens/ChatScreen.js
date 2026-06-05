import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert
} from 'react-native';

export default function ChatScreen({ roomId, user, name, goBack, otherUserId, role }) {
  const [showInstruction, setShowInstruction] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  console.log("OTHER USER ID:", otherUserId);
  console.log("ROLE:", role);

const loadMessages = async () => {
  try {
    const res = await fetch(`https://swaplearn-backend.onrender.com/api/messages/${roomId}/`);
    const data = await res.json();

    setMessages(data);

    const call = data.find(
      m => m.type === "call_request" && m.status === "pending"
    );

    if (call && call.sender !== user.user_id) {
      setIncomingCall(call);
    }

  } catch (err) {
    console.log(err);
  }
};

  useEffect(() => {
    if (!roomId) return;

    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const msg = text;
    setText("");

    setMessages(prev => [
      ...prev,
      { sender: user.user_id, text: msg }
    ]);

    try {
      await fetch(`https://swaplearn-backend.onrender.com/api/send-message/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender_id: user.user_id,
          room_id: roomId,
          text: msg
        })
      });

      loadMessages();
    } catch (err) {
      console.log(err);
    }
  };

  const startVideoCall = async () => {
    setShowInstruction(true);
    const meetingRoom = `swaplearn_${roomId}`;
    const url = `https://meet.jit.si/${meetingRoom}`;

    await fetch(
      "https://swaplearn-backend.onrender.com/api/send-message/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender_id: user.user_id,
          room_id: roomId,
          text: url,
          type: "call_request"
        })
      }
    );

  };  

    const joinCall = (url) => {

      Linking.openURL(url);

    };
  

  const endSession = async () => {

    console.log("END SESSION CALLED");

    try {

      let teacher_id, learner_id;

      if (role === "teacher") {
        teacher_id = user.user_id;
        learner_id = otherUserId;
      } else {
        teacher_id = otherUserId;
        learner_id = user.user_id;
      }

      console.log("Teacher:", teacher_id);
      console.log("Learner:", learner_id);

      const res = await fetch("https://swaplearn-backend.onrender.com/api/end_session/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teacher_id,
            learner_id,
          }),
        }
      );

      const data = await res.json();

      console.log("END SESSION RESPONSE:", data);

    } catch (err) {
      console.log("END SESSION ERROR:", err);
    }
  };


  const handleBack = () => {
      goBack();
  };

 const renderMessage = ({ item }) => {
  const isMe = String(item.sender) === String(user.user_id);

  return (
    <View style={{ alignItems: isMe ? "flex-end" : "flex-start", marginVertical: 5 }}>
      <View style={{
        backgroundColor: isMe ? "#4CAF50" : "#ddd",
        padding: 10,
        borderRadius: 10,
        maxWidth: "70%"
      }}>

       {item.type === "video_call" || item.text?.includes("meet.jit.si") ? (
          <View>
            <TouchableOpacity onPress={() => joinCall(item.text)}>
              <Text style={{ color: "blue", fontWeight: "bold" }}>
                📹 Join Video Call
              </Text>
            </TouchableOpacity>

            
          </View>
        ) : (
          <Text style={{ color: isMe ? "#fff" : "#000" }}>
            {item.text}
          </Text>
        )}

      </View>
    </View>
  );
};
        

  return (
    <View style={{ flex: 1, backgroundColor: "#f0f4f0" }}>

      {/* HEADER */}
      <View
        style={{
          backgroundColor: "#151a3c",
          padding: 15,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >

        <View>
          <TouchableOpacity onPress={handleBack}>
            <Text style={{ color: "#fff" }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ color: "#fff", fontSize: 18, marginTop: 5 }}>
            {name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={startVideoCall}
          style={{
            backgroundColor: "#4CAF50",
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 10
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            📹 Call
          </Text>
        </TouchableOpacity>
       
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{
          padding: 10,
          backgroundColor: "#f0f4f0"
        }}
      />

      <View style={{ flexDirection: "row", padding: 10 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 10
          }}
        />
        
        <TouchableOpacity
          onPress={sendMessage}
          style={{
            justifyContent: "flex-end",
            paddingBottom: 11
          }}
        >
          <Text style={{ padding: 10, fontWeight: "bold" }}>
            Send
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Migration "migration";
import Nat "mo:core/Nat";

(with migration = Migration.run)
actor {
  // Types
  type Video = {
    videoId : Text;
    title : Text;
    thumbnail : Text;
    addedBy : Text;
  };

  type ChatMessage = {
    nickname : Text;
    message : Text;
    timestamp : Int;
  };

  type User = {
    id : Text;
    nickname : Text;
  };

  type Room = {
    users : [User];
    queue : [Video];
    history : [Video];
    currentVideo : ?Video;
    isPlaying : Bool;
    currentTime : Float;
    chatHistory : [ChatMessage];
  };

  module Room {
    public func empty() : Room {
      {
        users = [];
        queue = [];
        history = [];
        currentVideo = null;
        isPlaying = false;
        currentTime = 0.0;
        chatHistory = [];
      };
    };
  };

  module User {
    public func compare(a : User, b : User) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  // Persistent storage
  let rooms = Map.empty<Text, Room>();

  // Helper functions
  func generateRoomCode() : Text {
    let time = Time.now();
    let code = Int.abs(time) % 1000000;
    code.toText();
  };

  func generateUserId() : Text {
    Time.now().toText();
  };

  // Actor methods
  public shared ({ caller }) func createRoom(nickname : Text) : async { roomCode : Text; userId : Text } {
    let roomCode = generateRoomCode();
    let userId = generateUserId();

    let room = Room.empty();
    let user : User = { id = userId; nickname };
    let updatedRoom = { room with users = [user] };

    rooms.add(roomCode, updatedRoom);

    { roomCode; userId };
  };

  public shared ({ caller }) func joinRoom(roomCode : Text, nickname : Text) : async {
    #ok : {
      roomCode : Text;
      userId : Text;
    };
    #err : Text;
  } {
    switch (rooms.get(roomCode)) {
      case (null) { #err("Room does not exist") };
      case (?_) {
        let userId = generateUserId();
        let user : User = { id = userId; nickname };
        switch (rooms.get(roomCode)) {
          case (null) { #err("Room not found after join attempt") };
          case (?room) {
            let updatedRoom = { room with users = room.users.concat([user]) };
            rooms.add(roomCode, updatedRoom);
            #ok { roomCode; userId };
          };
        };
      };
    };
  };

  public shared ({ caller }) func leaveRoom(roomCode : Text, userId : Text) : async () {
    switch (rooms.get(roomCode)) {
      case (null) { () };
      case (?room) {
        let filteredUsers = room.users.filter(func(user) { user.id != userId });
        if (filteredUsers.size() == 0) {
          rooms.remove(roomCode);
        } else {
          let updatedRoom = { room with users = filteredUsers };
          rooms.add(roomCode, updatedRoom);
        };
      };
    };
  };

  public query ({ caller }) func getRoomState(roomCode : Text) : async {
    #ok : {
      users : [User];
      currentVideo : ?Video;
      queue : [Video];
      history : [Video];
      isPlaying : Bool;
      currentTime : Float;
      chatHistory : [ChatMessage];
    };
    #err : Text;
  } {
    switch (rooms.get(roomCode)) {
      case (null) { #err("Room does not exist") };
      case (?room) {
        #ok {
          users = room.users.sort();
          currentVideo = room.currentVideo;
          queue = room.queue;
          history = room.history;
          isPlaying = room.isPlaying;
          currentTime = room.currentTime;
          chatHistory = room.chatHistory;
        };
      };
    };
  };

  public shared ({ caller }) func setPlayState(roomCode : Text, isPlaying : Bool, currentTime : Float) : async {
    #ok;
    #err : Text;
  } {
    switch (rooms.get(roomCode)) {
      case (null) { #err("Room does not exist") };
      case (?room) {
        let updatedRoom = { room with isPlaying; currentTime };
        rooms.add(roomCode, updatedRoom);
        #ok;
      };
    };
  };

  public shared ({ caller }) func addToQueue(roomCode : Text, userId : Text, videoId : Text, title : Text, thumbnail : Text) : async {
    #ok;
    #err : Text;
  } {
    switch (rooms.get(roomCode)) {
      case (null) { #err("Room does not exist") };
      case (?room) {
        let addedBy = switch (room.users.find(func(user) { user.id == userId })) {
          case (null) { userId };
          case (?user) { user.nickname };
        };
        let video : Video = {
          videoId;
          title;
          thumbnail;
          addedBy; // use nickname if found, otherwise userId
        };

        let updatedRoom = switch (room.currentVideo) {
          case (null) { { room with currentVideo = ?video } };
          case (?_) { { room with queue = room.queue.concat([video]) } };
        };
        rooms.add(roomCode, updatedRoom);
        #ok;
      };
    };
  };

  public shared ({ caller }) func nextVideo(roomCode : Text) : async { #ok; #err : Text } {
    switch (rooms.get(roomCode)) {
      case (null) { #err("Room does not exist") };
      case (?room) {
        switch (room.queue.size()) {
          case (0) { #err("Queue is empty") };
          case (_) {
            let newCurrent = room.queue[0];
            let newQueue = if (room.queue.size() > 1) {
              room.queue.sliceToArray(1, room.queue.size());
            } else {
              [];
            };
            let updatedRoom = {
              room with
              currentVideo = ?newCurrent;
              queue = newQueue;
            };
            rooms.add(roomCode, updatedRoom);
            #ok;
          };
        };
      };
    };
  };

  public shared ({ caller }) func previousVideo(roomCode : Text) : async { #ok; #err : Text } {
    switch (rooms.get(roomCode)) {
      case (null) { #err("Room does not exist") };
      case (?room) {
        switch (room.history.size()) {
          case (0) { #err("History is empty") };
          case (_) {
            let newCurrent = room.history[room.history.size() - 1];
            let newHistory = if (room.history.size() > 1) {
              room.history.sliceToArray(0, room.history.size() - 1);
            } else {
              [];
            };
            let updatedRoom = {
              room with
              currentVideo = ?newCurrent;
              history = newHistory;
            };
            rooms.add(roomCode, updatedRoom);
            #ok;
          };
        };
      };
    };
  };

  public shared ({ caller }) func sendChat(roomCode : Text, userId : Text, message : Text) : async {
    #ok;
    #err : Text;
  } {
    switch (rooms.get(roomCode)) {
      case (null) { #err("Room does not exist") };
      case (?room) {
        let nickname = switch (room.users.find(func(user) { user.id == userId })) {
          case (null) { userId };
          case (?user) { user.nickname };
        };
        let chatMessage : ChatMessage = {
          nickname;
          message;
          timestamp = Time.now();
        };
        let updatedRoom = { room with chatHistory = room.chatHistory.concat([chatMessage]) };
        rooms.add(roomCode, updatedRoom);
        #ok;
      };
    };
  };

  public query ({ caller }) func getConnectedUsers(roomCode : Text) : async { #ok : [User]; #err : Text } {
    switch (rooms.get(roomCode)) {
      case (null) { #err("Room does not exist") };
      case (?room) {
        #ok(room.users.sort());
      };
    };
  };
};

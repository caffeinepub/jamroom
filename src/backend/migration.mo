import Map "mo:core/Map";

module {
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

  type Actor = { rooms : Map.Map<Text, Room> };

  public func run(old : Actor) : Actor {
    old;
  };
};

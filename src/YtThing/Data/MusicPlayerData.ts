import MusicAudioStream from "./MusicAudioStream";
import MusicThumbnail from "./MusicThumbnail";

class MusicPlayerData {
	VideoId: string;
	Title: string;
	Artist: string;
	Thumbnail: MusicThumbnail[];
	AudioStreams: MusicAudioStream[];
}

export = MusicPlayerData;

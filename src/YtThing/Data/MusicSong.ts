import MusicArtist from "./MusicArtist";
import MusicItem from "./MusicItem";
import MusicItemType from "./MusicItemType";
import MusicThumbnail from "./MusicThumbnail";

class MusicSong implements MusicItem {
	readonly Type: MusicItemType = MusicItemType.Song;
	Name: string;
	Thumbnail: MusicThumbnail[];
	Artists: MusicArtist[];
	Album: string;
	VideoId: string;
	AlbumBrowseId: string;
	Duration: string;

	constructor(name: string, artists: MusicArtist[], thumbnail: MusicThumbnail[], album: string, videoId: string, albumBrowseId: string, duration: string) {
		this.Name = name;
		this.Artists = artists;
		this.Thumbnail = thumbnail;
		this.Album = album;
		this.VideoId = videoId;
		this.AlbumBrowseId = albumBrowseId;
		this.Duration = duration;
	}
}

export = MusicSong;

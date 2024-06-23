import MusicArtist from "./MusicArtist";
import MusicItem from "./MusicItem";
import MusicItemType from "./MusicItemType";
import MusicThumbnail from "./MusicThumbnail";

class MusicAlbum implements MusicItem {
	readonly Type: MusicItemType = MusicItemType.Album;
	Name: string;
	Thumbnail: MusicThumbnail[];
	BrowseId: string;
	Artists: MusicArtist[];
	Year: string;

	constructor(name: string, browseId: string, artists: MusicArtist[], thumbnail: MusicThumbnail[], year: string) {
		this.Name = name;
		this.BrowseId = browseId;
		this.Thumbnail = thumbnail;
		this.Artists = artists;
		this.Year = year;
	}
}

export = MusicAlbum;

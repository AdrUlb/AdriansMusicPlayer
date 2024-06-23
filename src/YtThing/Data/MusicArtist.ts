import MusicItem from "./MusicItem";
import MusicItemType from "./MusicItemType";
import MusicThumbnail from "./MusicThumbnail";

class MusicArtist implements MusicItem {
	readonly Type: MusicItemType = MusicItemType.Artist;
	Thumbnail: MusicThumbnail[];
	Name: string;
	BrowseId: string;

	constructor(name: string, browseId: string, thumbnail: MusicThumbnail[]) {
		this.Name = name;
		this.BrowseId = browseId;
		this.Thumbnail = thumbnail;
	}
}

export = MusicArtist;

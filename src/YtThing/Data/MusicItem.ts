import MusicItemType from "./MusicItemType";
import MusicThumbnail from "./MusicThumbnail";

interface MusicItem {
	readonly Type: MusicItemType;
	Name: string;
	Thumbnail: MusicThumbnail[];
}

export = MusicItem

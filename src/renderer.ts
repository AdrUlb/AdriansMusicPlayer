import { MusicSearchSuggestions, MusicItem, MusicPlayerData, MusicArtist, MusicSong, MusicAlbum } from "./YtThing/Data";
import MusicItemType from "./YtThing/Data/MusicItemType";
import "./index.css";

declare global {
	interface Window {
		electronExposed: {
			GetSearchSuggestions: (query: string) => void,
			OnGetSearchSuggestionsResults: (callback: ((suggestions: MusicSearchSuggestions) => void)) => void,

			SearchSongs: (query: string) => void
			OnSearchSongsResults: (callback: (res: MusicItem[]) => void) => void,

			SearchAlbums: (query: string) => void,
			OnSearchAlbumsResults: (callback: ((results: MusicItem[]) => void)) => void,

			SearchArtists: (query: string) => void,
			OnSearchArtistsResults: (callback: ((results: MusicItem[]) => void)) => void,

			Player: (videoId: string) => void,
			OnPlayerResult: (callback: ((player: MusicPlayerData) => void)) => void
		}
	}
}

const svgPlayButton = '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="currentColor"><path d="M320-203v-560l440 280-440 280Z"/></svg>';

const searchInputElement = document.getElementById("searchInput") as HTMLInputElement;
const searchButtonElement = document.getElementById("searchButton") as HTMLButtonElement;

const searchResultsSongsElement = document.getElementById("searchResultsSongs") as HTMLDivElement;
const searchResultsAlbumsElement = document.getElementById("searchResultsAlbums") as HTMLDivElement;
const searchResultsArtistsElement = document.getElementById("searchResultsArtists") as HTMLDivElement;

const searchSongsButtonElement = document.getElementById("searchSongsButton") as HTMLButtonElement;
const searchAlbumsButtonElement = document.getElementById("searchAlbumsButton") as HTMLButtonElement;
const searchArtistsButtonElement = document.getElementById("searchArtistsButton") as HTMLButtonElement;

const albumArtMissingElement = document.getElementById("albumArtMissing") as HTMLImageElement;
const albumArtElement = document.getElementById("albumArt") as HTMLImageElement;
const trackNameElement = document.getElementById("trackName") as HTMLDivElement;
const trackArtistElement = document.getElementById("trackArtist") as HTMLDivElement;

const prevButtonElement = document.getElementById("prevButton") as HTMLButtonElement;
const playButtonElement = document.getElementById("playButton") as HTMLButtonElement;
const nextButtonElement = document.getElementById("nextButton") as HTMLButtonElement;

let currentSong: MusicSong = null;
let currentAudioElement: HTMLAudioElement = null;

searchSongsButtonElement.addEventListener("click", () => {
	searchSongsButtonElement.classList.add("active");
	searchAlbumsButtonElement.classList.remove("active");
	searchArtistsButtonElement.classList.remove("active");

	searchResultsSongsElement.classList.remove("hidden");
	searchResultsAlbumsElement.classList.add("hidden");
	searchResultsArtistsElement.classList.add("hidden");
});

searchAlbumsButtonElement.addEventListener("click", () => {
	searchSongsButtonElement.classList.remove("active");
	searchAlbumsButtonElement.classList.add("active");
	searchArtistsButtonElement.classList.remove("active");

	searchResultsSongsElement.classList.add("hidden");
	searchResultsAlbumsElement.classList.remove("hidden");
	searchResultsArtistsElement.classList.add("hidden");
});

searchArtistsButtonElement.addEventListener("click", () => {
	searchSongsButtonElement.classList.remove("active");
	searchAlbumsButtonElement.classList.remove("active");
	searchArtistsButtonElement.classList.add("active");

	searchResultsSongsElement.classList.add("hidden");
	searchResultsAlbumsElement.classList.add("hidden");
	searchResultsArtistsElement.classList.remove("hidden");
});

const GetArtistsString = (artists: MusicArtist[]) => {
	return artists.map(artist => artist.Name).join(", ");
}

const PlaySong = (song: MusicSong) => {
	currentSong = song;
	window.electronExposed.Player(song.VideoId);
};

window.electronExposed.OnGetSearchSuggestionsResults(res => {
	console.log(res);
})

window.electronExposed.OnSearchSongsResults(res => {
	searchResultsSongsElement.innerHTML = "";
	res.forEach(item => {
		const song = item as MusicSong;
		const itemElement = document.createElement("div");
		itemElement.classList.add("searchResult");
		itemElement.classList.add("songSearchResult");

		const thumbnail = song.Thumbnail.reduce((prev, current) => (prev && prev.Width > current.Width) ? prev : current)

		const clickCallback = () => PlaySong(song);

		const albumArtElement = document.createElement("img");
		albumArtElement.classList.add("songArt");
		albumArtElement.src = thumbnail.Url;
		itemElement.appendChild(albumArtElement);

		const albumArtHoverPlayButtonElement = document.createElement("div");
		albumArtHoverPlayButtonElement.classList.add("songArtHoverPlayButton");
		albumArtHoverPlayButtonElement.innerHTML = svgPlayButton;
		albumArtHoverPlayButtonElement.addEventListener("click", clickCallback);
		itemElement.appendChild(albumArtHoverPlayButtonElement);

		const nameElement = document.createElement("p");
		nameElement.classList.add("songName");
		nameElement.innerText = song.Name;
		nameElement.addEventListener("click", clickCallback);
		itemElement.appendChild(nameElement);

		const artistElement = document.createElement("p");
		artistElement.classList.add("songArtist");
		artistElement.innerText = GetArtistsString(song.Artists);
		itemElement.appendChild(artistElement);

		const albumElement = document.createElement("p");
		albumElement.classList.add("songAlbum");
		albumElement.innerText = song.Album;
		itemElement.appendChild(albumElement);

		searchResultsSongsElement.appendChild(itemElement);
	});
	searchResultsSongsElement.scrollTo(0, 0);
});

window.electronExposed.OnSearchAlbumsResults(res => {
	searchResultsAlbumsElement.innerHTML = "";
	res.forEach(item => {
		const album = item as MusicAlbum;
		const itemElement = document.createElement("div");
		itemElement.classList.add("searchResult");
		itemElement.classList.add("albumSearchResult");

		const thumbnail = album.Thumbnail.reduce((prev, current) => (prev && prev.Width > current.Width) ? prev : current)

		const albumArtElement = document.createElement("img");
		albumArtElement.classList.add("albumArt");
		albumArtElement.src = thumbnail.Url;
		itemElement.appendChild(albumArtElement);

		const nameElement = document.createElement("p");
		nameElement.classList.add("albumName");
		nameElement.innerText = album.Name;
		itemElement.appendChild(nameElement);

		const albumArtistElement = document.createElement("p");
		albumArtistElement.classList.add("albumArtist");
		albumArtistElement.innerText = GetArtistsString(album.Artists);
		itemElement.appendChild(albumArtistElement);

		const albumLabelElement = document.createElement("p");
		albumLabelElement.classList.add("albumLabel");
		albumLabelElement.innerText = "Album";
		itemElement.appendChild(albumLabelElement);

		searchResultsAlbumsElement.appendChild(itemElement);
	});
	searchResultsAlbumsElement.scrollTo(0, 0);
});

window.electronExposed.OnSearchArtistsResults(res => {
	searchResultsArtistsElement.innerHTML = "";
	res.forEach(item => {
		const artist = item as MusicArtist;
		const itemElement = document.createElement("div");
		itemElement.classList.add("searchResult");
		itemElement.classList.add("artistSearchResult");

		const thumbnail = artist.Thumbnail.reduce((prev, current) => (prev && prev.Width > current.Width) ? prev : current)

		const albumArtElement = document.createElement("img");
		albumArtElement.classList.add("artistImage");
		albumArtElement.src = thumbnail.Url;
		itemElement.appendChild(albumArtElement);

		const nameElement = document.createElement("p");
		nameElement.classList.add("artistName");
		nameElement.innerText = artist.Name;
		itemElement.appendChild(nameElement);

		const artistLabelElement = document.createElement("p");
		artistLabelElement.classList.add("artistLabel");
		artistLabelElement.innerText = "Artist";
		itemElement.appendChild(artistLabelElement);

		searchResultsArtistsElement.appendChild(itemElement);
	});
	searchResultsArtistsElement.scrollTo(0, 0);
});

window.electronExposed.OnPlayerResult(res => {
	if (currentAudioElement) {
		currentAudioElement.pause();
		currentAudioElement.innerHTML = "";
		currentAudioElement.load();
	}

	const audioElement = document.createElement("audio");
	currentAudioElement = audioElement;

	for (const quality of ["AUDIO_QUALITY_HIGH", "AUDIO_QUALITY_MEDIUM", "AUDIO_QUALITY_LOW"]) {
		for (const stream of res.AudioStreams) {
			if (stream.Quality !== quality)
				continue;

			const source = document.createElement("source");
			source.type = stream.MimeType;
			source.src = stream.Url + "&range=0-" + stream.ContentLength;
			audioElement.appendChild(source);
		}
	}

	audioElement.play();

	const thumbnail = res.Thumbnail.reduce((prev, current) => (prev && prev.Width > current.Width) ? prev : current);
	albumArtElement.src = thumbnail.Url;
	albumArtElement.classList.remove("hidden");
	albumArtMissingElement.classList.add("hidden");
	trackNameElement.innerText = currentSong?.Name ?? "Nothing Playing";
	trackArtistElement.innerText = currentSong != null ? GetArtistsString(currentSong.Artists) : "Nothing Playing";
});

searchInputElement.addEventListener("input", e => {
	window.electronExposed.GetSearchSuggestions(searchInputElement.value);
});

searchInputElement.addEventListener("keydown", e => {
	if (e.key === "Enter") {
		window.electronExposed.SearchSongs(searchInputElement.value);
		window.electronExposed.SearchAlbums(searchInputElement.value);
		window.electronExposed.SearchArtists(searchInputElement.value);
	}
});

searchButtonElement.addEventListener("click", e => {
	window.electronExposed.SearchSongs(searchInputElement.value);
});

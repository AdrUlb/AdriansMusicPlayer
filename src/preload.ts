import { contextBridge, ipcRenderer } from "electron";
import { MusicSearchSuggestions, MusicItem, MusicPlayerData } from "./YtThing/Data";

contextBridge.exposeInMainWorld("electronExposed", {
	GetSearchSuggestions: (query: string) => ipcRenderer.send("GetSearchSuggestions", query),
	OnGetSearchSuggestionsResults: (callback: ((suggestions: MusicSearchSuggestions) => void)) => ipcRenderer.on("GetSearchSuggestionsResults", (event, value) => callback(value)),
	
	SearchSongs: (query: string) => ipcRenderer.send("SearchSongs", query),
	OnSearchSongsResults: (callback: ((results: MusicItem[]) => void)) => ipcRenderer.on("SearchSongsResults", (event, value) => callback(value)),
	
	SearchAlbums: (query: string) => ipcRenderer.send("SearchAlbums", query),
	OnSearchAlbumsResults: (callback: ((results: MusicItem[]) => void)) => ipcRenderer.on("SearchAlbumsResults", (event, value) => callback(value)),
	
	SearchArtists: (query: string) => ipcRenderer.send("SearchArtists", query),
	OnSearchArtistsResults: (callback: ((results: MusicItem[]) => void)) => ipcRenderer.on("SearchArtistsResults", (event, value) => callback(value)),
	
	Player: (videoId: string) => ipcRenderer.send("Player", videoId),
	OnPlayerResult: (callback: ((player: MusicPlayerData) => void)) => ipcRenderer.on("PlayerResult", (event, value) => callback(value))
});

import { app, BrowserWindow, ipcMain, session } from "electron";
import * as YtThing from "./YtThing";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require("electron-squirrel-startup")) {
	app.quit();
}

const createWindow = () => {
	const filter = {
		urls: ["https://*.googleusercontent.com/*", "https://*.youtube.com/*", "https://*.googlevideo.com/*"]
	}
	session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
		details.requestHeaders['Host'] = 'music.youtube.com'
		details.requestHeaders['Origin'] = 'https://music.youtube.com'
		details.requestHeaders['Referer'] = 'https://music.youtube.com/'
		callback({ requestHeaders: details.requestHeaders })
	})

	const mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
		}
	});

	mainWindow.setMenuBarVisibility(false);

	ipcMain.on("GetSearchSuggestions", (event, query) => {
		YtThing.GetSearchSuggestions(query).then(res => event.sender.send("GetSearchSuggestionsResults", res));
	});

	ipcMain.on("SearchSongs", (event, query) => {
		YtThing.SearchSongs(query).then(res => event.sender.send("SearchSongsResults", res));
	});

	ipcMain.on("SearchAlbums", (event, query) => {
		YtThing.SearchAlbums(query).then(res => event.sender.send("SearchAlbumsResults", res));
	});

	ipcMain.on("SearchArtists", (event, query) => {
		YtThing.SearchArtists(query).then(res => event.sender.send("SearchArtistsResults", res));
	});

	ipcMain.on("Player", (event, videoId) => {
		YtThing.Player(videoId).then(res => event.sender.send("PlayerResult", res));
	});

	// and load the index.html of the app.
	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY, { userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" });

	// Open the DevTools.
	mainWindow.webContents.openDevTools();
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

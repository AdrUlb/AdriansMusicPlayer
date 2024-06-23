import * as https from "https";
import * as nodeQuerystring from "node:querystring";
import * as vm from "vm";
import { MusicItem, MusicArtist, MusicAlbum, MusicSong, MusicSearchSuggestions, MusicPlayerData } from "./Data";
import MusicAudioStream from "./Data/MusicAudioStream";
import MusicSearchSuggestedQuery from "./Data/MusicSearchQuerySuggestion";
import MusicTextSegements from "./Data/MusicTextSegements";
import MusicThumbnail from "./Data/MusicThumbnail";

//const playerJsCache = new Map();
let _playerJs: string = null;

const ApiPost = (endpoint: string, payload: any) => new Promise<any>((resolve, reject) => {
	const payloadString = JSON.stringify(payload);

	const options = {
		hostname: "music.youtube.com",
		port: 443,
		path: endpoint,
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json",
			"Content-Length": payloadString.length
		}
	}

	const req = https.request(options, res => {
		const data: Buffer[] = [];

		res.on("data", d => {
			data.push(d)
		});

		res.on("end", () => {
			resolve(JSON.parse(Buffer.concat(data).toString()));
		});
	});

	req.on("error", e => {
		reject(e);
	});

	req.write(payloadString);
	req.end();
});

const FetchPlayerHtml = (videoId: string) => new Promise<string>((resolve, reject) => {
	const options = {
		hostname: "www.youtube.com",
		port: 443,
		path: "/watch?v=" + videoId,
		method: "GET",
		headers: {
			"Accept": "text/html",
			"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
		}
	}

	const req = https.request(options, res => {
		const data: Buffer[] = [];

		res.on("data", d => {
			data.push(d);
		});

		res.on("end", () => {
			resolve(Buffer.concat(data).toString());
		});
	});

	req.on("error", e => {
		reject(e);
	});

	req.end();
});

const FetchPlayerJs = (videoId: string) => new Promise<string>(async (resolve, reject) => {
	if (_playerJs)
		return resolve(_playerJs);

	const playerHtml = await FetchPlayerHtml(videoId);
	const playerJsPath = /\/s\/player\/[A-z0-9-_.\/]*?\/base\.js/.exec(playerHtml)[0];

	const options = {
		hostname: "www.youtube.com",
		port: 443,
		path: playerJsPath,
		method: "GET",
		headers: {
			"Accept": "text/html",
			"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
		}
	}

	const req = https.request(options, res => {
		const data: Buffer[] = [];

		res.on("data", d => {
			data.push(d);
		});

		res.on("end", () => {
			const playerJs = Buffer.concat(data).toString();
			//playerJsCache.set(videoId, playerJs);
			_playerJs = playerJs;
			resolve(playerJs);
		});
	});

	req.on("error", e => {
		reject(e);
	});

	req.end();
});

const GetSignatureTimestampFromPlayerJs = (playerJs: string) => {
	return /sts="([0-9]+?)"/.exec(playerJs)[1];
};

const ParseThumbnail = (thumbnail: any) => {
	const thumbnails: MusicThumbnail[] = [];
	thumbnail.thumbnails?.forEach((t: any) => {
		thumbnails.push({
			Width: t.width,
			Height: t.height,
			Url: t.url
		});
	});
	return thumbnails;
};

const ParseMusicResponsiveListItemRenderer = (musicResponsiveListItemRenderer: any): MusicItem => {
	const navigationEndpoint = musicResponsiveListItemRenderer.navigationEndpoint;

	const column1 = musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs;

	const name = column1[0].text;
	const thumbnails = ParseThumbnail(musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail);

	const musicPageType = navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;

	if (musicPageType == "MUSIC_PAGE_TYPE_ARTIST")
		return new MusicArtist(name, navigationEndpoint.browseEndpoint.browseId, thumbnails);

	if (musicPageType && musicPageType !== "MUSIC_PAGE_TYPE_ALBUM")
		return null;

	let artists: MusicArtist[] = [];
	let album: string;
	let albumBrowseId: string;
	let duration: string;

	let musicVideoType: string = null;

	musicResponsiveListItemRenderer.flexColumns.forEach((column: any) => {
		column = column.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
		let sepCount = 0;
		column?.forEach((run: any, index: number) => {
			if (run.text === " • ") {
				sepCount++;
				return;
			}

			if (run.text === " & " || run.text === ", ")
				return;

			if (!run.navigationEndpoint && column.length == 1)
				return;

			if (!run.navigationEndpoint && index == 0 && musicPageType == "MUSIC_PAGE_TYPE_ALBUM")
				return;

			const browsePageType = run.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;

			musicVideoType = run.navigationEndpoint?.watchEndpoint?.watchEndpointMusicSupportedConfigs?.watchEndpointMusicConfig?.musicVideoType ?? musicVideoType;

			if (musicVideoType == "MUSIC_VIDEO_TYPE_ATV") {
				musicVideoType = null;
				return;
			}

			if (musicVideoType) {
				return;
			}

			if (browsePageType == "MUSIC_PAGE_TYPE_ALBUM") {
				album = run.text;
				albumBrowseId = run.navigationEndpoint.browseEndpoint.browseId;
				return;
			}

			if (sepCount >= 2 && run.text.includes(":")) {
				duration = run.text;
			}
			else if (index < column.length - 1) {
				const artist = run.text;
				const artistBrowseId = browsePageType == "MUSIC_PAGE_TYPE_ARTIST" ? run.navigationEndpoint.browseEndpoint.browseId : null;
				artists.push(new MusicArtist(artist, artistBrowseId, thumbnails));
			}
		});
	});

	if (musicVideoType) {
		return null;
	}

	if (musicPageType == "MUSIC_PAGE_TYPE_ALBUM")
		return new MusicAlbum(name, navigationEndpoint.browseEndpoint.browseId, artists, thumbnails, null);

	if (column1[0].navigationEndpoint?.watchEndpoint) {
		const videoId = column1[0].navigationEndpoint.watchEndpoint.videoId;
		return new MusicSong(name, artists, thumbnails, album, videoId, albumBrowseId, duration);
	}

	return null;
};

const ParseSearchSuggestions = (json: any) => {
	const queries: MusicSearchSuggestedQuery[] = [];
	const items: MusicItem[] = [];
	json.contents?.forEach((content: any) => {
		content.searchSuggestionsSectionRenderer.contents.forEach((item: any) => {
			if (item.searchSuggestionRenderer) {
				const textSegments: MusicTextSegements[] = [];
				item.searchSuggestionRenderer.suggestion.runs.forEach((run: any) => {
					textSegments.push({
						Text: run.text,
						Bold: run.bold ?? false
					});
				});

				const query = item.searchSuggestionRenderer.navigationEndpoint.searchEndpoint.query;
				queries.push({
					Query: query,
					TextSegments: textSegments
				});
			}

			if (item.musicResponsiveListItemRenderer) {
				items.push(ParseMusicResponsiveListItemRenderer(item.musicResponsiveListItemRenderer));
			}
		});
	});
	return {
		Queries: queries,
		Items: items
	} as MusicSearchSuggestions;
};

const ParseSearch = (json: any) => {
	const items: MusicItem[] = [];
	if (!json.contents)
		return items;

	json.contents?.tabbedSearchResultsRenderer?.tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.forEach((content: any) => {
		content?.musicShelfRenderer?.contents?.forEach((c: any) => {
			const item = ParseMusicResponsiveListItemRenderer(c.musicResponsiveListItemRenderer);
			if (item)
				items.push(item);
		});
	});
	return items;
};

const SolveSignature = (scrambledSignature: string, playerJs: string) => {
	const regex1 = /=function\(a\){a=a\.split\(""\);((LO)\.[\S\s]+?);return a\.join\(""\)};/.exec(playerJs);
	const unscrambleCalls = regex1[1];
	const operationObjectName = regex1[2];

	const regex2 = new RegExp(operationObjectName + "={[\\S\\s]+?}}").exec(playerJs);
	const operationObject = regex2[0];
	const toEval = "const " + operationObject + ";let a='" + scrambledSignature + "'.split('');" + unscrambleCalls + ";a.join('')";
	const solvedSignature = vm.runInNewContext(toEval);
	return solvedSignature;
};

const SolveN = (n: string, playerJs: string) => {
	const regex1 = /\.get\("n"\)\)&&\([A-z]+?=([A-z]+?)\[([0-9])\]/.exec(playerJs);
	const arrayName = regex1[1];
	const index = regex1[2];

	const regex2 = new RegExp("var " + arrayName + "=\\[([A-z\\,]+?)\\];").exec(playerJs);
	const objName = regex2[1].split(",")[parseInt(index)];

	const regex3 = new RegExp(objName + "=function\\(a\\){([\\S\\s]+?)};").exec(playerJs);
	const toEval = "(() => {let a='" + n + "';" + regex3[1] + "})()";
	const solvedN = vm.runInNewContext(toEval);
	return solvedN;
}

const ParsePlayer = (json: any, playerJs: string) => {
	// TODO: proper error handling
	if (json.playabilityStatus.status !== "OK")
		return null;

	const videoId = json.videoDetails.videoId;
	const audioStreams: MusicAudioStream[] = [];
	const title = json.videoDetails.title;
	const artist = json.videoDetails.author;
	const thumbnail = ParseThumbnail(json.videoDetails.thumbnail);

	json.streamingData.adaptiveFormats.forEach((format: any) => {
		const mimeType = format.mimeType;
		if (!mimeType.startsWith("audio/"))
			return;

		const contentLength = format.contentLength;
		const audioQuality = format.audioQuality;

		const signatureCipher = nodeQuerystring.parse(format.signatureCipher);
		const scrambledSignature = signatureCipher["s"].toString();
		const signatureParam = signatureCipher["sp"].toString();

		const url = new URL(signatureCipher["url"].toString());
		const signature = SolveSignature(scrambledSignature, playerJs);
		url.searchParams.set("n", SolveN(url.searchParams.get("n"), playerJs));
		url.searchParams.append(signatureParam, signature);

		audioStreams.push({
			MimeType: mimeType,
			ContentLength: contentLength,
			Quality: audioQuality,
			Url: url.toString()
		});
	});

	return {
		VideoId: videoId,
		Title: title,
		Artist: artist,
		Thumbnail: thumbnail,
		AudioStreams: audioStreams
	} as MusicPlayerData;
};

const GetSearchSuggestions = async (query: string) => {
	const res = await ApiPost("/youtubei/v1/music/get_search_suggestions?prettyPrint=false", {
		"input": query,
		"context": {
			"client": {
				"clientName": "WEB_REMIX",
				"clientVersion": "1.20240617.01.00"
			}
		}
	});

	return ParseSearchSuggestions(res);
};

const SearchSongs = async (query: string) => {
	const res = await ApiPost("/youtubei/v1/search?prettyPrint=false", {
		"context": {
			"client": {
				"clientName": "WEB_REMIX",
				"clientVersion": "1.20240617.01.00"
			}
		},
		"query": query,
		"params": "EgWKAQIIAWoQEAMQBBAJEAoQBRAREBAQFQ%3D%3D"
	});

	return ParseSearch(res);
};

const SearchAlbums = async (query: string) => {
	const res = await ApiPost("/youtubei/v1/search?prettyPrint=false", {
		"context": {
			"client": {
				"clientName": "WEB_REMIX",
				"clientVersion": "1.20240617.01.00"
			}
		},
		"query": query,
		"params": "EgWKAQIYAWoSEAkQAxAOEAoQBBAFEBEQEBAV"
	});

	return ParseSearch(res);
};

const SearchArtists = async (query: string) => {
	const res = await ApiPost("/youtubei/v1/search?prettyPrint=false", {
		"context": {
			"client": {
				"clientName": "WEB_REMIX",
				"clientVersion": "1.20240617.01.00"
			}
		},
		"query": query,
		"params": "EgWKAQIgAWoSEAkQAxAOEAoQBBAFEBEQEBAV"
	});

	return ParseSearch(res);
};

const Player = async (videoId: string) => {
	const playerJs = await FetchPlayerJs(videoId);
	const signatureTimestamp = GetSignatureTimestampFromPlayerJs(playerJs);

	const res = await ApiPost("/youtubei/v1/player?prettyPrint=false", {
		videoId,
		"context": {
			"client": {
				"clientName": "WEB_REMIX",
				"clientVersion": "1.20240617.01.00"
			}
		},
		"playbackContext": {
			"contentPlaybackContext": {
				signatureTimestamp
			}
		}
	});

	return ParsePlayer(res, playerJs);
};

export {
	GetSearchSuggestions,
	SearchSongs,
	SearchAlbums,
	SearchArtists,
	Player
};

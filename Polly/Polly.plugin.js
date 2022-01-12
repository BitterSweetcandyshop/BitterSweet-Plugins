/**
 * @name Polly
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/B1tterSw33t/BitterSweet-Plugins
 * @source https://github.com/B1tterSw33t/BitterSweet-Plugins/raw/main/Polly/Polly.plugin.js
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"info":{"name":"Polly","authors":[{"name":"BitterSweet","discord_id":"927695547421310996","github_username":"B1tterSw33t"}],"invite":"swK8nFAV29","version":"1.2.0","description":"Polly is a piracy plugin made to run piracy cli commands in discord like streamrip and youtube-dl","github":"https://github.com/B1tterSw33t/BitterSweet-Plugins","github_raw":"https://github.com/B1tterSw33t/BitterSweet-Plugins/raw/main/Polly/Polly.plugin.js"},"changelog":[{"title":"Welcome here's what I can do!","items":["Download youtube videos","Download music"]},{"title":"CHECK YOUR SETTINGS","items":["Make sure the paths are currect, defualt is linux based!","Make sure you have the right cli selected!","Choose the media codec(s) you want"]}],"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
	const { spawn } = require('child_process')
	const {Patcher, WebpackModules, DiscordContextMenu, Toasts, Settings} = Library

	return class Polly extends Plugin {

		// Default Settings
		constructor() {
			super()
			this.defaultSettings = {}
			// logins
			this.defaultSettings.deezerAllowed = false
			this.defaultSettings.tidalAllowed = false
			this.defaultSettings.qobuzAllowed = false
			// Extras
			this.defaultSettings.musicHoardingAllowed = false
			// paths
			this.defaultSettings.ytdlPath = "~/documents/youtube/%(channel)s/%(title)s.%(ext)s"
			// codecls 
			this.defaultSettings.ytdlCodec = "mp4"
		}

		// Downloader object to manage download methods
		Downloader = {
			handleChild: (command, args) => {
				try {
					let childProcess = spawn(command, args)
					let failed = false
					this.ToasterBath.success("Started Download")
					childProcess.stderr.on("data", (data) => {
						console.log(data)
						this.ToasterBath.error("Failed Download " + data)
						failed = true
					})
					childProcess.on("close", () => {
						if (!failed) this.ToasterBath.success("Download Completed")
					})
				} catch (e) {
					this.ToasterBath.error("Failed Download")
				}
			},
			youtube: (url) => {
				this.Downloader.handleChild("youtube-dl", ["-o", this.settings.ytdlPath, "-f", this.settings.ytdlCodec, url])
			},
			streamrip: (url) => {
				this.Downloader.handleChild("rip", ["url", url])
			},
			deemix: (url) => {
				this.Downloader.handleChild("python3", ["-m", "deemix", "-p", this.settings.audioPath, url])
			},
			youtubeAudio: (url) => {
				this.Downloader.handleChild("youtube-dl", ["-o", this.settings.audioPath, "--extact-audio", "--audio-format", 'best', url])
			},
		}

		// I just got tired of typing the full
		// thing everytime so I'm taking a toaster bath
		ToasterBath = {
			success: (text) => {
				Toasts.show(text, {
					type: "success",
					timeout: 3000
				})
			},
			error: (text) => {
				Toasts.show(text, {
					type: "error",
					timeout: 3000
				})
			}
		}

		buildOptionsMenu(content) {
			let menu = []
			let links = content.match(/https?:\/\/((www|listen|play)\.)?(youtube|deezer|tidal|soundcloud|qobuz)\.(com|be)\S+/mgi)
			// you see, I only regexed sites streamrip supports,
			// to avoid making an api call that would be very slow
			// since I am clearly very smart
			if (!links.length) return false
			for (let link of links) {
				let site = link.match(/youtube|tidal|qobuz|soundcloud|deezer/im)[0]
				console.log(`"${site}"`)
				switch (site) {
					case "youtube":
						menu.push(DiscordContextMenu.buildMenuItem({
							label: "Youtube (streamrip)",
							type: "text",
							action: () => this.Downloader.streamrip(link)
						}))
						menu.push(DiscordContextMenu.buildMenuItem({
							label: "Youtube (youtube-dl)",
							type: "text",
							action: () => this.Downloader.youtube(link)
						}))
						break
					case "tidal":
						if (this.settings.tidalAllowed) {
							menu.push(DiscordContextMenu.buildMenuItem({
								label: "Tidal (streamrip)",
								type: "text",
								action: () => this.Downloader.streamrip(link)
							}))
						}
						break
					case "deezer":
						if (this.settings.deezerAllowed) {
							menu.push(DiscordContextMenu.buildMenuItem({
								label: "Deezer (streamrip)",
								type: "text",
								action: () => this.Downloader.streamrip(link)
							}))
						}
						break
					case "soundcloud":
						menu.push(DiscordContextMenu.buildMenuItem({
							label: "Soundcloud (streamrip)",
							type: "text",
							action: () => this.Downloader.streamrip(link)
						}))
						break
					case "qobuz":
						if (this.settings.qobuzAllowed) {
							menu.push(DiscordContextMenu.buildMenuItem({
								label: "Qobuz (streamrip)",
								type: "text",
								action: () => this.Downloader.streamrip(link)
							}))
						}
						break
				}
			}
			if (!menu.length) return false
			return menu
		}

		async onStart() {
			const MessageContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu")
           		
			// Patch into the context menu
			// Credit: The Commie Axolotl#6898
			Patcher.after(MessageContextMenu, "default", (_, [props], component) => {
				let message = props.message
				let submenu = this.buildOptionsMenu(message.content)
				console.log(submenu)
				if (!submenu) return
				component.props.children.push(DiscordContextMenu.buildMenuItem({
					label: "Polly",
					type: "submenu",
					children: submenu
				}))
			})	
		}

		onStop() {
			Patcher.unpatchAll()
		}

		getSettingsPanel() {
			return Settings.SettingPanel.build(this.saveSettings.bind(this),
				new Settings.SettingGroup("Youtube-DL").append(
					new Settings.Textbox(
						"Youtube-DL Path",
						"youtube-dl scripting, case sensitive.",
						this.settings.ytdlPath,
						(e) => {
							this.settings.ytdlPath = e
						}
					),
					new Settings.RadioGroup(
						"Audio Codec",
						"Usually the CLIs use ffmpeg, also will download best quality of choosen codec.",
						this.settings.ytdlCodec,
						[
							{name: "Best", value: "best", desc: "Uses best available option", color: "#ffffff"},
							{name: "Worst", value: "worst", desc: "Uses worst availble option", color: "#ffffff"},
							{name: "MP4", value: "mp4", desc: "", color: "#ffffff"},
							{name: "FLV", value: "flv", desc: "", color: "#ffffff"}

						],
						(e) => {
							this.settings.ytdlCodec = e
						}
					)
				),
				// Music Downloader
				new Settings.SettingGroup("Streamrip").append(
					new Settings.Switch("Deezer Login", "", this.settings.deezerAllowed, (e) => {this.settings.deezerAllowed = e;}),
					new Settings.Switch("Tidal Login", "", this.settings.tidalAllowed, (e) => {this.settings.tidalAllowed = e;}),
					new Settings.Switch("Qobuz Login", "", this.settings.deezerAllowed, (e) => {this.settings.qobuzAllowed = e;}),
					new Settings.Switch("Music Hoarder Mode", "Find and download entire artist always from album/track link", this.settings.musicHoardingAllowed, (e) => {this.settings.musicHoardingAllowed = e;}, {disabled: true}),
				)
			)
		}
	}
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
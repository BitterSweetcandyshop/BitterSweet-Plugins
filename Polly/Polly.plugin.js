/**
 * @name Polly
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website 
 * @source 
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
    const config = {"info":{"name":"Polly","authors":[{"name":"BitterSweet","discord_id":"927695547421310996","github_username":"B1tterSw33t"}],"invite":"swK8nFAV29","version":"1.0.0","description":"Polly is a piracy plugin made to run piracy cli commands in discord like streamrip and youtube-dl","github":"","github_raw":""},"changelog":[{"title":"Firt Release","items":["Just an example update"]}],"main":"index.js"};

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

		// Settings
		constructor() {
			super()
			this.defaultSettings = {}
			this.defaultSettings.path = "~/documents/youtube/%(channel)s/%(title)s.%(ext)s"
		}

		// Downloader object to manage download methods
		Downloader = {
			youtube: (url) => {
				try {
					let ytdlProcess =spawn("youtube-dl", ["-o", this.settings.path, url])
					Toasts.show("Started Download", {
						type: "success",
						timeout: 3000
					})
					ytdlProcess.stderr.on("data", (data) => {
						console.error(data)
						Toasts.show("Failed Download " + e, {
							type: "error",
							timeout: 3000
						})
					})
					ytdlProcess.on("close", () => {
						Toasts.show("Finished Download", {
							type: "success",
							timeout: 3000
						})
					})
				} catch (e) {
					Toasts.show("Failed Download " + e, {
						type: "error",
						timeout: 3000
					})
				}
			}
		}

		async onStart() {
			const MessageContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "MessageContextMenu")
           		
			// Patch into the context menu
			// Credit: The Commie Axolotl#6898
			Patcher.after(MessageContextMenu, "default", (_, [props], component) => {
				let message = props.message
				let link = message.content.match(/https?:\/\/(www\.)?youtube\.com\S+/i)
				if (!link) return
				component.props.children.push(DiscordContextMenu.buildMenuItem({
					label: "Polly",
					type: "text",
					action: () => {
						this.Downloader.youtube(link)
					}
				}))

			})	
		}

		onStop() {
			Patcher.unpatchAll()
		}

		getSettingsPanel() {
			return Settings.SettingPanel.build(this.saveSettings.bind(this),
				new Settings.Textbox(
					"Youtube-DL Path",
					"Folder path to download media, supports youtube-dl scripting.",
					this.settings.path,
					(e) => {
						this.settings.path = e
					}
				),
			)
		}
	}
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
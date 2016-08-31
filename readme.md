@beyond-sharepoint/spo-shell

_insert snazzy logo_

> Cross-Platform interactive command shell for SharePoint Online

spo-shell is a cross-platform implementation of SharePoint shell commands written in straight ES6. No powershell cmdlets and confusing PnP installs.

While young, spo-shell aims to offer an alternative feel for navigating SharePoint online and to open the door to cross-platform bash-like scripting in a Javascript environment.

``` bash
> npm install @beyond-sharepoint/spo-shell -g
> spo-shell
spo / $
```
_insert snazzy gif_

### _Where have you been all my SharePoint career, spo-shell???_

But there's more.

## Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Supported commands](#supported-commands)
- [Configuration (.env)](#configuration)
- [FAQ](#faq)
- [Team](#team)
- [License](#license)
- [Wiki](https://github.com/beyond-sharepoint/spo-shell/wiki)

## Introduction

spo-shell is a project working on a cross-platform implementation of common SharePoint administrative operations in pure JavaScript and with no external dependencies.

The goal of spo-shell is to open up these commands to the massive JavaScript community.  Also, spo-shell provides a cleaner, simpler and flexible alternative to the SharePoint Online cmdlets and SharePointPnP cmdlets for those wanting to perform SharePoint Online tasks in a better way.

## Installation

spo-shell requires NodeJS > 6.0. with node installed, simply execute the following:

``` bash
$ npm install @beyond-sharepoint/spo-shell -g
```

now execute spo-shell

``` bash
$ spo-shell
```

####Windows Users

Steps: 
- Install [chocolately](https://chocolatey.org/install)
- Install NodeJS and Python2 via chocolatey:

```bash
C:\> cinst nodejs.install python2 -y
```
Now run the same npm install command:
``` bash
C:\> npm install @beyond-sharepoint/spo-shell -g
```

Now run spo-shell.
``` bash
C:\> spo-shell
```

## Supported commands

The goal is to have a majority of Sharepoint PowerShell cmdlets as well as Office PnP cmdlets implemented along with powershell-like features.

Here's what's currently supported:
---
#### Core commands
- curl
- grep
- less
- ls
- Select-Object (alias: select)

#### Apps

#### Branding

- Add-SPOJavaScriptLink
- Get-SPOJavaScriptLink
- Get-SPOWelcomePage
- Remove-SPOJavaScriptLink
- Set-SPOWelcomePage

#### Connections

#### Files

- Download-SPOFile (alias: dl)
- Upload-SPOFile

#### Folders

- Get-SPOFolderByServerRelativeUrl

#### Lists

- Get-SPOListByTitle

#### Site Collections

- Get-SPOSite

#### Tenants

#### Users

## Configuration

spo-shell can read the SharePoint URL, Username and Password through environment variables.

spo-shell_tenanturl: URL to the SPO Tenant
spo-shell_username: SPO Username
spo-shell_password: SPO Password


If a file named .env file exists in the installation folder, spo-shell will use those settings.

## FAQ

#### Why not SharePoint Online Powershell cmdlets?

spo-shell allows one to interact with SharePoint online in an interactive manner.

spo-shell is also cross-platform and has less installation dependencies -- it can be fully scriped via popular command line tools.

If one is already familiar with developent via SharePoint Framework then using spo-shell is a symbiotic solution. 

#### But powershell is cross-platform now. (August '16)

Sure, but there's not a SPO Powershell for .net core. Yet (?)

## Team

Just me.

## License

ISC © [Sean McLellan](https://github.com/oceanswave)
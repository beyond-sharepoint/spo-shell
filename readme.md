@beyond-sharepoint/spo-shell

<h1 align="center">
	<img width="288" src="https://raw.githubusercontent.com/beyond-sharepoint/spo-shell/master/SPO-Shell-Horizontal.png" alt="spo-shell">
</h1>

> Cross-Platform interactive command shell for SharePoint Online

spo-shell is a cross-platform implementation of SharePoint shell commands written in straight ES6. No powershell cmdlets and confusing PnP installs.

spo-shell aims to offer an alternative feel for navigating and administering SharePoint Online and to open the door to cross-platform bash-like scripting in a Javascript environment.

Simply install

``` bash
$ npm install @beyond-sharepoint/spo-shell -g
$ spo-shell
spo:/$
```
And start working with SharePoint Online on your terms!

_insert snazzy gif_

### _Where have you been all my life, spo-shell???_

Want to upload the contents of an entire folder? No worries, mon.

``` bash
spo:/Shared Documents$ up ./MyApp/ .
```

Yeah, but what about recursively, and only update files if the source is newer? Got that too.

``` bash
spo:/Shared Documents$ up ./MyApp/ . --Recurse --Update
```

What if I want to do some local dev, but sync those changes with SPO.. but use checksums to determine differences, like rsync? Yep.

``` bash
spo:/Shared Documents$ up ./MyApp/ . -r -u --Checksum --Watch
```

spo-shell lets you peruse your SPO environment and perform hassle-free site content provisioning, no add-ins. Simple.

### Sweet. But what about performing admin commands; like adding/removing JSLInk.

We got 'ya. spo-shell has a bunch of SPO/SPPnP cmdlets built-in... in a powershelly like fashion.

``` bash
spo:/Shared Documents$ Add-SPOJavaScriptLink --Name "My JSLink" --ScriptSrc "https://myfavcdn.com/jquery.min.js"--Scope Site --Sequence 999 
```

-or-

``` bash
spo:/Shared Documents$ Set-SPOWelcomePage --Url "/mynewwelcomepage.aspx"
```

The goal is to have a majority of these commands (at least the ones that make sense) available. See the (roadmap)[#roadmap)

### But... I like the built-in powershell commands

spo-shell has some basic powershell commands built-in. For instance, Select-Object:

``` bash
spo:/$ Get-SPOSite | select --Property Url --Property Owner --ExpandProperty Owner
```

``` js
{ Url: 'https://mytenant.sharepoint.com',                                                                                         
  Owner:                                                                                                                             
   { __metadata:                                                                                                                     
      { id: 'https://mytenant.sharepoint.com/_api/Web/GetUserById(5)',                                                            
        uri: 'https://mytenant.sharepoint.com/_api/Web/GetUserById(5)',                                                           
        type: 'SP.User' },                                                                                                           
     Groups: { __deferred: { uri: 'https://mytenant.sharepoint.com/_api/Web/GetUserById(9)/Groups' } },                           
     Id: 9,                                                                                                                          
     IsHiddenInUI: false,                                                                                                            
     LoginName: 'c:0-.f|rolemanager|s-1-2-34-56798304-345345345-345345345345345345',                                              
     Title: 'Company Administrator',                                                                                                 
     PrincipalType: 4,                                                                                                               
     Email: '',                                                                                                                      
     IsShareByEmailGuestUser: false,                                                                                                 
     IsSiteAdmin: true,                                                                                                              
     UserId: null } }                      
```

Notice that these commands are SPO "Aware", in the above example, ExpandProperty actually expanded the deferred url in the returned SPSite object.

### But... I like xNix commands

Got 'ya there too:

``` bash
spo:/$ Get-SPOSite | grep url -i
```

``` js
  ServerRelativeUrl: '/',                                                                                                            
  ShowUrlStructure: false,                                                                                                           
  Url: 'https://tenanturl.sharepoint.com' } 
```

#### Wow. But I want this programmatically!

Absoutely, spo-shell provides an implementation against the SharePoint Online REST api

Simply import the module, authenticate, and call the desired methods.

``` js
const spo = require('@beyond-sharepoint/spo-shell');
const spoApi = spo.spoApi;

var spoContext = spo.authenticate("mytenantname.sharepoint.com", "myusername@mytenantname.onmicrosoft.com", "mypassword")
    .then(function(ctx) {
        console.log("Logged into SharePoint Online.");
        spoContext = ctx;
    }, function() {
        console.log("something went wrong.");
    });

spoApi.addJavaScriptLink(spoContext, {
        Name: 'Foo',
        ScriptSrc: 'https://mycdn.com/jquery.min.js',
        Scope: 'Site',
        Sequence: 999,
    }).then(function(res) {
        console.log(res);
        });
```

With the spo-shell api, you can automate SPO administration within Gulp tasks, for example, with your SharePoint Framework project.

## Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Supported commands](#supported-commands)
- [Configuration (.env)](#configuration)
- [FAQ](#faq)
- [Design Goals](#design-goals)
- [Roadmap](#roadmap)
- [Team](#team)
- [License](#license)
- [Wiki](https://github.com/beyond-sharepoint/spo-shell/wiki)

## Introduction

spo-shell is a project working on a cross-platform implementation of common SharePoint administrative operations in pure JavaScript and with no .net dependencies.

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

On windows the steps are much the same, I suggest using Chocolatey to deploy the required bits.

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

Here's what's currently supported, and is rapidly expanding:
---
#### Core commands
- cd
- curl
- grep
- less
- ls
- mkdir (alias: md)
- rmdir (alias: rd)
- Select-Object (alias: select)

#### Apps

_TODO_

#### Branding

- Add-SPOJavaScriptLink
- Get-SPOJavaScriptLink
- Get-SPOWelcomePage
- Remove-SPOJavaScriptLink
- Set-SPOWelcomePage

#### Connections

_TODO_

#### Files

- Download-SPOFile (alias: dl)
- Upload-SPOFile (alias: ul)

#### Folders

- Get-SPOFolderByServerRelativeUrl

#### Lists

- Get-SPOListByTitle

#### Site Collections

- Get-SPOSite

#### Tenants

_TODO_

#### Users

_TODO_

## Configuration

In interactive mode, spo-shell can read the SharePoint URL, Username and Password through environment variables.

spo-shell_tenanturl: URL to the SPO Tenant
spo-shell_username: SPO Username
spo-shell_password: SPO Password

If a file named .env file exists in the installation folder, spo-shell will use those settings.

It's suggested to do something similar when writing your own JS scripts or gulp tasks.

## FAQ

#### Why not SharePoint Online Powershell cmdlets?

spo-shell allows one to interact with SharePoint online in an interactive manner.

spo-shell is also cross-platform and has less installation dependencies -- it can be fully scriped via popular command line tools.

If one is already familiar with developent via SharePoint Framework then using spo-shell is a symbiotic solution. 

#### But powershell is cross-platform now. (August '16)

Sure, but there's not a SPO Powershell for .net core. Yet (?)

#### You can'nae change the laws of physics, Jim!

I'm not, Scotty. All interactions with SharePoint Online are through the documented REST services. 

Treat SharePoint as a service (SPaaS)

## Design goals

Common File/Folder manipulation is performed via console like commands. (cd/mkdir/etc)

Interaction with the actual SharePoint objects are through the Powershell-esque commands and return the actual object (Get-SPOFolderByServerRelativeUrl, etc)


## Roadmap

-[ ] Implement all SharePoint Online Powershell cmdlets.
-[ ] Implement all SharePoint PnP Powershell cmdlets.
-[ ] Interact with the MS Graph
-[ ] Support NTLM-based auth
-[ ] Support On-Prem

## Team

Just me. Feel free to submit PRs and I'll be happy to add you.

## License

ISC © [Sean McLellan](https://github.com/oceanswave)


[beyond-sharepoint](https://github.com/beyond-sharepoint)
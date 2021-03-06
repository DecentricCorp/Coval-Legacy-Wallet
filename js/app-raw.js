 /* Globals */
var bitcore, ECIES, kloudlessAuth, explorers, insight, transaction, viewQrcode, p2p, message, node, BootstrapDialog, multiStageHelp, oldconsole, Mnemonic, accounts
var settings = {}
var foundIdentity = []
var lazyCheck, getDisplayName, checkLocalIdentity
var onPage = function (cb) {
    var page, title, simple
    var hash = window.location.hash.replace('#', '')
    
    /* Check onboard status */
    newtables.settings.getOrDefault("onboard", [], function(err, result) {
        
            /*if (err || result.value.length < 4) {
                hash = "onboard"
                $(".score").fadeIn()
            }*/
       
        switch (hash) {
            case "":
            case null:
            case "wallet":
                page = "wallet.html"
                title = "Wallet"
                simple = "wallet"
                break;
            case "chat":
                simple = "chat"
                break;
            case "keys":
                page = "keys.html"
                title = "Key Management"
                simple = "keys"
                break;
            case "video-chat":
                page = "video-chat.html"
                title = "Chat / Video"
                simple = ""
                break;
            case "thankyou":
                page = "thankyou.html"
                title = "Thank You"
                simple = "thankyou"
                break;
            case "raw":
                page = "raw.html"
                title = "Create a raw transaction"
                simple = ""
                break;
            case "import":
                page = "import.html"
                title = "Import / Export"
                simple = "import"
                break;
            case "address":
                page = "address.html"
                title = "Generate Addresses"
                simple = ""
                break;
            case "settings":
                page = "settings.html"
                title = "Settings"
                simple = ""
                break;
            case "onboard":
                page = "onboard.html"
                title = "Training"
                simple = "onboard"
                break;
            default :
                page = hash + ".html"
                simple = "dynamic"
                break;
        }
        return cb({ page: page, title: title, simple: simple })
    })
}


/* Entry */
$(document).ready(function () {
    /*oldconsole = window.console
    function customLog(msg) {
       oldconsole.log(msg)
    }
    window.console = {
        log: function(msg) { customLog(msg) },
        info: function(msg) { customLog(msg) },
        warn: function(msg) { customLog(msg) }
    }*/

    /*if ((top.location.origin.indexOf("localhost") < 0 && (top.location.origin.indexOf("staging") < 0) && top.location.origin.indexOf("vault.local") < 0) && document.referrer === "") {
        location.href="http://wallet.ribbit.me"
    }*/
    if (verbose) console.log(document.referrer)
    renderSplashScreenContent({})
    handleSettings(function ()  {
        /* Bitcore Early */
        bitcore = require('bitcore')
        Mnemonic = require('bitcore-mnemonic');
        ECIES = require('bitcore-ecies')
        explorers = require('bitcore-explorers-multi')
        
        var current = settings.currentcoin
        if (current != null) {
            bitcore.Networks.AvailableNetworks.set(current.name)
            insight = bitcore.Networks.AvailableNetworks.currentNetwork().insight
            switchCoinImage(current.short, current.name)
        } else {
            insight = new explorers.Insight("ribbit")
            bitcore.Networks.AvailableNetworks.set("ribbit")
        }
        transaction = new bitcore.Transaction()
        viewQrcode = new QRCode("qrcode")

        /* Modals EARLY */ 
        bindClicks()
        initKloud()
        $.material.init()
        
        popLoginModalSelection();
        
        /*
        
        newtables.settings.getOrDefault("terms", false, function (err, result) {
            if (err || !result.value) {
                //http://nakupanda.github.io/bootstrap3-dialog/
                BootstrapDialog.show({
                    message: "<iframe data-intro='Please read these Terms of Use.' data-position='left' src = \"js/ViewerJS/#../../Digital Wallet Terms of Use.pdf \" width='724' height='1024' allowfullscreen webkitallowfullscreen></iframe>",
                    title: "Please read and accept the Terms of Use before continuing",
                    buttons: [{
                            label: 'I Agree',
                            cssClass: 'btn-primary',
                            action: function (dialog) {
                                dialog.close();
                                newtables.settings.insert("terms", true, function () {
                                    popLoginModalSelection()
                                })
                            }
                        }, {
                            label: 'Cancel',
                            cssClass: 'btn-warning',
                            action: function (dialog) {
                                dialog.close();
                                window.location = "../"
                            }
                        }]
                })
            } else {
                popLoginModalSelection()
            }
        })
        */
    })
})
/* Page is completely loaded */
$(window).load(function() {
    setTimeout(function () { handleSettingsElementFromStore() }, 500)
})

function deferredLoad() {
    preInit(function() {
        registerHandlebarHelpers()
        renderCoinMenu()
        renderChatModule()
        renderPeerChatModule()
        detectIncognito(function(a) { if (verbose) console.log(a) })
        setTimeout(function() { $(".navmenu").fadeIn("slow") }, 900)
        initApplication()
    })
}

function loadFireComplete(cb) {
    /* Stop buttons from reloading page*/
    $("button").attr("onclick", "javascript: return false")
    /*Hide if Electron */
    if (inElectron) {
        $(".notElectron").hide()
    }
    try {
        
        //This can exist as a unique method on templates
        complete()

        //Check to see if new user
        /*onPage(function (out) {
            var cookie = getCookie("newuser-" + out.simple)
            console.log(cookie)
            if (cookie === null || cookie === "true") {
                console.log("is new")
                setCookie("newuser-" + out.simple, false)
                setTimeout(function(){$(".help").click()},500)
            } else { }
        })*/
    } catch (e) {}
    if (verbose) console.info("Load Complete")
    cb()
}

function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (275 * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}

/* Cookies */

/* Kloudless */

function initKloudless(element) {
    
    Kloudless.authenticator(element, {
        'app_id': 'bZHisu_8861zNPS5TdfCc3j3ddy3pjJENtghT0BFaMH_9yE1'
    }, kloudlessAuth )
    $("#kloudless_iexd").attr("src", "kloudlessproxy.html")
}

kloudlessAuth = function(err, authResult) {
    var payload = {}
    if (err) {

        payload = getCloudFeedback(false, result, payload)
        console.log("Error here:")
        console.error(JSON.parse(err))
        console.error('An error occurred with Kloudless:', err);
        return;
    }
    if (verbose) console.log(authResult)
    newtables.cloud.insert(authResult.service, authResult.id, function(result) {
        if (verbose) console.log(result)
        renderImportTemplate()
        canAutoSave(function(canAuto) {
             if (canAuto) {
                 silentExportToCloud(function() {
                     if (verbose) {console.log("Done auto saving")}
                 })
             }
        })
    })
}


function removeCloudService(service) {
    newtables.cloud.remove(service, function() {
        renderImportTemplate()
    })
}

function handleSettings(cb) {
    //Bootstrap profile fields
    newtables.settings.keys(function (keys) {
        
        function nameBootstrap() {
            if (!keys.contains("name")) {
                keys.push("name")
                newtables.settings.insert("keys",keys, function() {
                    nicknameBootstrap()
                })
            } else {
                nicknameBootstrap()
            }
        }
        
        function nicknameBootstrap() {
            if (!keys.contains("nickname")) {
                keys.push("nickname")
                newtables.settings.insert("keys", keys, function () {
                    socialBootstrap()
                })
            } else {
                socialBootstrap()
            }
        }
        
        function socialBootstrap() {
            if (!keys.contains("social")) {
                keys.push("social")
                newtables.settings.insert("keys", keys, function () {
                    bioBootstrap()
                })
            } else {
                bioBootstrap()
            }
        }
        
        function bioBootstrap() {
            if (!keys.contains("bio")) {
                keys.push("bio")
                newtables.settings.insert("keys", keys, function () {
                    if (verbose) { console.info("Done bootstrapping profile keys") }
                })
            } 
        }

        /*Start Bootstrap*/
        nameBootstrap()
    })

    onPage(function(onPage) {
        settings.onPage = onPage
        settings.inFrame = function () {
            return top !== window
        }
        
        var loadApplication = 
         getOrSetSetting("displayname", "", function (setting) {
                    settings.displayname = setting
                    getOrSetSetting("currentcoin", { name: "coval", short: "coval" }, function (setting) {
                        settings.currentcoin = setting
                        return appendAllSettings(cb)
                    })
                })
    })
    
    
    //onboarding first
    /*getOrSetSetting("onboard", {seen:false, level:0, dismissed:false}, function(setting) {
        settings.onboard = setting
        loadApplication
    })*/
}

function appendAllSettings(cb) {
    getSettingsAsDataTable(function (d) {
        var records = d.rows
        $.each(records, function (item) {
            settings[records[item].key] = records[item].value
            //console.log(records[item].key + " " + records[item].value)
        })
         //return console.log(d.rows)
    })
    return cb()
}

function getOrSetSetting(settingname, settingdefault, cb) {
    Vault.getSettingValue(settingname, function (val) {
        if (val === null) {
            Vault.addSetting(settingname, settingdefault, function () { })
            return cb(false)
        } else {
            return cb(val)
        }
    })
}

/* Iframe */
/*iframeLoaded = function() {
    console.log("loaded iframe content")
    /* Cleanup Canvas size #1#
    $(".canvas").width($(window).width() - Number(offset()))
    var options = {}
    if (top.verbose) options.log = true
    iFrameResize(options)
}*/

/* Functions */
var preInit = function(cb) {

    handleMenuToggle()
    loadPageByHash()

    
    getDisplayName = function(element) {
        Vault.getSettingValue("DisplayName", function(setting) {
            if (setting !== undefined) {
                element.val(setting)
            }
        })
    }
    lazyCheck = function () {
        setTimeout(function () { checkLocalIdentity() }, 5000)
    }
    lazyCheck()
    checkLocalIdentity = function() {
        //foundIdentity = []
        var setLocalIdentity = function(id) {
            newtables.privkey.allRecordsArray(function (rows) {
                $.each(rows, function () {
                    var record = $(this)[0]
                    if (record.isIdentity) {
                        foundIdentity.push(record.key)
                        sendEmailConfirmIfNecessary()
                        //meshnet.checkInit()
                        return ifRelaySubscribeToBlockchains()
                    }
                })
            })
        }
        newtables.privkey.keys(function(keys) {
             if (keys.error) { //If no identity exists create one
                 newtables.privkey.newIdentity("Identity",function(out) {
                    return setLocalIdentity()
                 })
             } else {
                return setLocalIdentity()
             }
        })
    }
    explorers = require('bitcore-explorers-multi')
    adjustDesign()
    cb()
}

var offset = function() {
     return $(".canvas").attr("style").replace("left:", "").replace("px;", "").trim().split(" ")[0]
}

var handleMenuToggle = function() {
    setTimeout(function () {
        if ($(".canvas").hasClass("canvas-slid")) {
            setTimeout(function (){$(".coin-sellect").css("display", "inherit")},700)
            $('.menu-item').removeClass('bounceOutLeft')
            $('.menu-item').addClass('animated bounceInLeft')
            //sm
            $('.menu-item-sm').removeClass('bounceInLeft')
            $('.menu-item-sm').addClass('animated bounceOutLeft')
        } else {
            $('.menu-item').removeClass('bounceInLeft')
            $('.menu-item').addClass('animated bounceOutLeft')
            //sm
            $('.menu-item-sm').removeClass('bounceOutLeft')
            $('.menu-item-sm').addClass('animated bounceInLeft')
           
        }
    }, 500)
}

var getQueryStringParam = function(target) {
    var queryDict = {}
    location.search.substr(1).split("&").forEach(function (item) { queryDict[item.split("=")[0]] = item.split("=")[1] })
    return queryDict[target]
}

var loadPageByHash = function () {
    
    onPage(function(pageData) {
        if (pageData.title !== "Wallet") {
            loadBalance($(".balance-container"))
        }
        showContent()
        switch (pageData.title) {
            case "Wallet":
                var to = escapeHtml(getParameterByName("to"))
                return renderWalletTemplate({ to: to })
            case "Training":
                return renderOnboardingTemplate({})
            case "Profile":
                return renderProfileTemplate({})
            case "Key Management":
                return renderKeysTemplate({})
            case "Import / Export":
                return renderImportTemplate({})
            case "Settings":
                return renderSettingsTemplate({})
            default :
                return renderHashTemplate({})
        }
    })
}

var loadPageExplicitely = function (page, type) {
    if (page !== "wallet") {
        loadBalance($(".balance-container"))
    }
    location.hash = page
    
    if (type === "handlebar") {
        settings.onPage = {simple: page}
        showContent()
    }
    switch (page) {
        case "wallet":
        var to = escapeHtml(getParameterByName("to"))
            return renderWalletTemplate({to: to})
        case "profile":
            return renderProfileTemplate({})
        case "keys":
            return renderKeysTemplate({})
        case "import":
            return renderImportTemplate({})
        case "chat":
            return showChat()
        case "training":
            return renderDynamicTemplate("onboard")
        case "settings":
            return renderSettingsTemplate({})
    }
}

function setSetting(value,target,type,cb) {
    Vault.addSetting(target + type, value, function () { 
        handleSettings(function () {
            return cb()
        })
    })
}

function adjustDesign() {
    $(".togglebutton input").css("margin", "5px")
}

function handleSettingsElementFromStore() {
    matchPageSettingsToDatastore($(this))
}

function handleToggleSettingAction(context) {
    persistSettingToggleToDatastore(context)
}

function handleProfileImageUpload(context) {
    var fileInput = context.get(0)
    var fileDisplayArea = $("div[for='profileImage']")
    var file = fileInput.files[0];
    var imageType = /image.*/;
    
    if (file.type.match(imageType)) {
        var reader = new FileReader();
        reader.onload = function (e) {
            $(".carousel-inner .item.active img").attr("src", reader.result)
            
            newtables.settings.insert("profileImage", { location: "base64", data: reader.result }, function (doc) {
                fileDisplayArea.css('background-image', 'url(' + reader.result + ')')
                if (verbose) console.log(doc)
                setTimeout(function() {
                     //top.meshnet.publicIdentityCommand("update", function() {})
                },3000)
            })
        }
        
        reader.readAsDataURL(file);
    } else {
        top.popMsg("File not supported!")
    }
}

function handleAccountUpload(context, cb) {
    var fileInput = context.get(0)
    var file = fileInput.files[0]
    var fileType

    if (mobileAndTabletcheck()) {
        var hiddenInput = $("input[for='"+$(fileInput).attr("id")+"']")
        var data = hiddenInput.val()
        return cb(data)
    } else {
        fileType = "text/plain"
        if (file.type.match(fileType)) {
            var reader = new FileReader();
            reader.onload = function(e) {
                return cb(reader.result)
            }
            reader.readAsText(file)
        } else {
            top.popMsg("File not supported!")
        }
    }
}

function getHeight() {
    return $(window).height() - $('h1').outerHeight(true);
}

/************* DATATABLE STUFF ***********
 * 
 *              Much is boilerplate
 * 
 *****************************************/
function initTables(){
    var $table = $('#table'),
        $remove = $('#remove'),
        selections = [];
    $(function () {
        $table.bootstrapTable({});
        $table.on('check.bs.table uncheck.bs.table ' +
            'check-all.bs.table uncheck-all.bs.table', function () {
            $remove.prop('disabled', !$table.bootstrapTable('getSelections').length);
            // save your data, here just save the current page
            selections = getIdSelections();
                // push or splice the selections if you want to save all data selections
        });
        $table.on('all.bs.table', function (e, name, args) {
            //This is where I can save the changes
            if (name.indexOf('editable-save') === 0) {
                var interestingRecord = args[1]._id
                var fieldEdited = args[0]
                Vault.getRecordFilteredOfType(Vault.tables.address, "_id", interestingRecord, function (data) {
                    data[fieldEdited] = args[1][fieldEdited]
                    initAllTheThings()
                    return Vault.tables.address.put(data)
                })
            }
            if (verbose) console.log(name, args);
        });
        $remove.click(function () {
            var ids = getIdSelections();
            $table.bootstrapTable('remove', {
                field: 'id',
                values: ids
            });
            $remove.prop('disabled', true);
        });
        $(window).resize(function () {
            $table.bootstrapTable('resetView', {
                height: getHeight()
            });
        });
    });
}

function loadProfileImageView() {
    for (i = 1; i < 94; i++) {
        $('<div class="item"><img src="images/avatars/characters_'+i+'.png"></div>').insertBefore(".item.active");
    }
        

}

function getIdSelections() {
    return $.map($table.bootstrapTable('getSelections'), function (row) {
        return row.id
    });
}
function responseHandler(res) {
    $.each(res.rows, function (i, row) {
        row.state = $.inArray(row.id, selections) !== -1;
    });
    return res;
}
function operateFormatter(value, row, index) {
    return [
        '<a class="like" href="javascript:void(0)" title="Like">',
        '<i class="glyphicon glyphicon-heart"></i>',
        '</a>  ',
        '<a class="remove" href="javascript:void(0)" title="Remove">',
        '<i class="glyphicon glyphicon-remove"></i>',
        '</a>'
    ].join('');
}
window.operateEvents = {
    'click .like': function (e, value, row, index) {
        alert('You click like action, row: ' + JSON.stringify(row));
    },
    'click .remove': function (e, value, row, index) {
        $table.bootstrapTable('remove', {
            field: 'id',
            values: [row.id]
        });
    }
};
function totalTextFormatter(data) {
    return 'Total';
}
function totalNameFormatter(data) {
    return data.length;
}
function totalPriceFormatter(data) {
    var total = 0;
    $.each(data, function (i, row) {
        total += +(row.price.substring(1));
    });
    return '$' + total;
}

function linkPrivKeyFormatter(value, row, index) {
    return [
        '<a href="javascript:void(0)" title="Like">',
        '<i class="glyphicon glyphicon-eye-open"></i>',
        '</a>  '
    ].join('');
}
function linkPubKeyFormatter(value, row, index) {
    return [
        '<a href="javascript:void(0)" title="Like">',
        '<i class="glyphicon glyphicon-eye-open"></i>',
        '</a>  '
    ].join('');
}

function matchPageSettingsToDatastore() {
    /* Toggles */
    $.each($(".togglebutton input"), function () {
        var togglefor = $(this).attr("for")
        var target = $(this).attr("toggletype")
        var toggle = $(this)
        newtables.settings.getOrDefault(togglefor + target, false, function(err, doc) {
            toggle.prop("checked", doc.value)
            if (target === "advanced" && doc.value) {
                $(".advanced").show()
            }
        })
    })
    /* Background Images */
    $.each($("div[for]"), function () {
        var target = $(this).attr("for")
        var img = $(this)
        newtables.settings.get(target, function (err, out) {
            if (err) { return }
            
            var url = out.value
            if (url.location === "stock") {
                //img.attr("src", "./images/avatars/characters_" + url.id + ".png")
                img.css('background-image', 'url(./images/avatars/characters_' + url.id + '.png)')
            } else if (url.location === "base64") {
                //img.attr("src", url.data)
                img.css('background-image', 'url(' + url.data + ')')
            }
        })
    })
    /* Images */
    $.each($("img[for]"), function () {
        var target = $(this).attr("for")
        var img = $(this)
        newtables.settings.get(target, function (err, out) {
            if (err) { return }
            
            var url = out.value
            if (url.location === "stock") {
                //img.attr("src", "./images/avatars/characters_" + url.id + ".png")
                img.css('background-image', 'url(./images/avatars/characters_' + url.id + '.png)')
                img.attr("src", "")
            } else if (url.location === "base64") {
                //img.attr("src", url.data)
                img.attr("src", "")
                img.css('background-image', 'url(' + url.data + ')')
            }
        })
    })
    /* Text Inputs */
    $.each($("input[for][type='text']"), function(key, value) {
        var target = $(this).attr("for")
        var input = $(this)
        handleProfileSaveButton()
        newtables.settings.get(target, function(err, out) {
            if (err) {
                return
            }
            input.val(out.value)
            if (key + 1 === $("input[for][type='text']").length) {
                //If I'm done with these lets auto save
                try {
                    canAutoSave(function(canAuto) {
                        if (canAuto) {
                            silentExportToCloud(function () {
                                //Do something after save
                            })
                        }
                    })
                } catch (e) {}
            }
        })
    })
    /* Text Area Inputs */
    $.each($("textarea[for]"), function () {
        var target = $(this).attr("for")
        var input = $(this)
        newtables.settings.get(target, function (err, out) {
            if (err) { return }
            input.val(out.value)
        })
    })
    /* Links */
    $.each($("a[for]"), function () {
        var target = $(this).attr("for")
        var input = $(this).find("span")
        newtables.settings.get(target, function (err, out) {
            if (err) { return }
            if (out.value !== undefined && out.value !== "") {
                input.text(out.value)
            }
        })
    })


}

function persistSettingToggleToDatastore(context) {
    var togglefor = context.attr("for")
    var target = context.attr("toggletype")
    var toggle = context
    newtables.settings.insert(togglefor + target, context.is(":checked"), function(err,doc) {
        if (toggle.is(":checked")) {
            $(".advanced").show()
        } else {
            $(".advanced").hide()
        }
    })
}

var initApplication = function() {

    initAllTheThings()
    if (verbose) console.log("Init Application")
    //$.material.init();
    var options = { selectorAttribute: "data-target" };
    $('#tabs').stickyTabs(options);
    renderChatList()
    loadBalance($(".balance-container"))
    setTimeout(function () { $(".splash").fadeOut() }, 100)
    toggleChat("close")
    accounts = new Accounts({minPassphraseLength: 6});
}

function popMsg(msg) {
    if ($("iframe").length > 0 || top === window) {
        $('.top-right').notify({ message: { text: msg }, type: "bangTidy" }).show()
    } else  {top.popMsg(msg)}
}

/************* Click Binding ***************
 * 
 *   Namespaced to allow easy management
 *    Bound to document click so we can
 * bind to elements that might not yet exist
 * 
 * *****************************************/
function bindClicks() {
    /* Unbind by localnamespace togglebutton(Awesome way to unbind a selective everything) */
    $(document).unbind(".customBindings")

    $(window).resize(function() {
        adjustDesign()
    });
    
    /* Chat Toggle */
    $(document).on('mouseenter.customBindings', '.users', function (data) {
        toggleChat("open")
    })
    $(document).on('mouseleave.customBindings', '.users', function (data) {
        toggleChat("close")
    })
    
    
    /* Login press enter */
    $(document).on('keypress.customBindings', '#emailPasswordInput', function (data) {
        var code = (data.keyCode ? data.keyCode : data.which);
        if (code == 13) { //Enter keycode                        
            data.preventDefault();
            
            $(".validateEmailPassword").click();
        }
    })
    
    /* Chat press enter */
    $(document).on('keypress.customBindings', '#chatInput', function (data) {
        var code = (data.keyCode ? data.keyCode : data.which);
        if (code == 13) { //Enter keycode                        
            var target = $(this)
            var msg = target.val()
            $(this).val("")
            if (!settings.inFrame()) {
                var chat = new Chat({ "payload": msg })
                setTimeout(function () { chat.broadcast() }, 500)
            }
        }
    })
    
    /* Help */
    $(document).on('click.customBindings', '.help', function () {
        /*if (multiStageHelp !== undefined && multiStageHelp.step !== undefined) {
            multiStageHelp.step[0]()
        } else {
            $('body').chardinJs('start')
        }*/
    })


    /* Navbar toggle */
    $(document).on('click.customBindings', '.new-navbar-toggle', function() {
        //handleMenuToggle()
        showNav()
    })

    /* Remove Cloud */
    $(document).on('click.customBindings', '.cloud-remove', function() {
        var data = $(this).attr("data")
        removeCloudService(data)
    })

    /* First Cloud Export */
    $(document).on('click.customBindings', '.cloud-export', function() {
        //exportToCloudWithPicker()
        popFileExportModal(false)
    })

    /* Skip Step */
    $(document).on('click.customBindings', '.skip-step', function() {
        var data = $(this).attr("for")
        var next = $("." + data).parent().parent().next().find(".panel-heading")
        next.removeClass("disabled")
        next.find(".skip-step").removeClass("disabled")
        $("." + data).find(".panel-heading").addClass("disabled")
    })

    /* Profile Save Button */
    $(document).on('click.customBindings', '.profileSaveButton', function() {
        popMsg("Saved profile settings")
    })

    /* Toggle Profile Pic */
    $(document).on('click.customBindings', 'div[for="profileImage"]', function() {
        changeProfileImageStock($(this))
    })

    /* Logout */
    $(document).on('click.customBindings', '.logout', function() {
        canAutoSave(function(canAuto) {
            if (canAuto) {
                silentExportToCloud(function() {
                    return logoutLocalAccount()
                })
            } else {
                return popFileLogoutConfirmModal()
            }
        })
    })
    /* Locked Logout */
    $(document).on('click.customBindings', '.logout-locked', function () {
        logoutLocalAccount()
    })

    /*Carousel */
    $(document).on('slide.bs.carousel.customBindings', "#profile-carousel", function(direction, target) {
        var index = Number($(direction.relatedTarget.children[0]).attr("src").split('_')[1].replace('.png', ''))
        changeProfileImageStock(index)
    })

    /* Upload Image */
    $(document).on('change.customBindings', "#profileImageUpload", function() {
        handleProfileImageUpload($(this))
    })


    /* Change Coin Menu */
    $(document).on('click.customBindings', '.coinPicker', function() {
        toggleCoinSelection()
    })
    $(document).on('touchstart.customBindings', '.coinPicker', function() {
        toggleCoinSelection()
    })

    /* Menu Chat */
    /*$(document).on('click.customBindings', '.small-chat-link', function () {
            showChat()
        })*/

    /* Change Coin */
    $(document).on('click.customBindings', '.coinSelect', function() {
        handleCoinContextChange($(this))
    })
    $(document).on('touchstart.customBindings', '.coinSelect', function() {
        handleCoinContextChange($(this))
    })
    
    function handleCoinContextChangeByName(newCoin, newCoinName) {
        switchCoinImage(newCoin, newCoinName)
        bitcore.Networks.AvailableNetworks.set(newCoinName)
        var displayName = bitcore.Networks.AvailableNetworks.get(newCoinName).display
        $(".coinName").html(displayName)
        $(".coinNameBuyButton").html(displayName)
        $(".buyCoinButton").attr("href","https://www.cryptsy.com/markets/view/"+newCoin.toUpperCase()+"_BTC")
        insight = bitcore.Networks.AvailableNetworks.currentNetwork().insight
        newtables.settings.insert("currentcoin", { name: newCoinName, short: newCoin }, function(doc) {
            //windowProxy.post({ command: "contextSwitch", payload: insight })
            var updateCoinTo = insight.network.name
            var short = "rbr"
            if (updateCoinTo === "livenet") {
                updateCoinTo = "bitcoin"
                short = "btc"
            }
            top.settings.currentcoin = { "name": updateCoinTo, "short": short }
            loadAddressPicker()
            top.bitcore.Networks.AvailableNetworks.set(updateCoinTo)
            top.insight = top.bitcore.Networks.AvailableNetworks.currentNetwork().insight
            top.settings.currentcoin = { name: updateCoinTo, short: short }
            top.bitcore.Networks.AvailableNetworks.set(updateCoinTo)
            $("#toAddress").val("")

            popMsg("Wallet context changed to " + $(".coinPicker").attr("name").toUpperCase())
        })
    }
    
    function handleCoinContextChange(element) {
        hideCoinSelection()
        var newCoin = element.attr("data")
        var newCoinName = element.attr("name")
        return handleCoinContextChangeByName(newCoin, newCoinName)
    }

    /* Tooltip Hover */
    $(document).on('mouseover.customBindings', '[action="tooltip"]', function() {
        var title = $($(this).get(0)).attr("tooltip-title")
        var content = $($(this).get(0)).attr("tooltip-content")
        var target = $($(this).get(0)).attr("for")
        renderToolTip({ "title": title, "content": content, top: $(this).position().top - 40, target: target })
    })
    /* Tooltip un Hover */
    $(document).on('mouseout.customBindings', '[action="tooltip"]', function() {
        var target = $($(this).get(0)).attr("for")
        var tip = $(".toolTip").children("[for='" + target + "']")
        tip.fadeOut(function() {
            tip.remove()
        })
    })

    /* Any hash link that should load framed content */
    $(document).on('click.customBindings', '.navlink', function() {
        if ($(this).attr("href") === undefined) {
            return
        }
        var toPage = $(this).attr("page")
        var linkType = $(this).attr("type")
        if (linkType === undefined) {
            linkType = "handlebar"
        }
        //loadPageByHash()
        loadPageExplicitely(toPage, linkType)
        hideNav()
    })
    $(document).on('click.customBindings', '.peer-pay', function() {
        loadPageExplicitely("wallet")
    })
    /* Import HD Key */
    $(document).on('click.customBindings', '.importKey', function(data) {
        top.newtables.privkey.importHD($("#inputpk").val(), $("#labelInput").val(), function(record) {
            if (verbose) console.log(record)
            popMsg("Sucessfully imported key")
            loadPageExplicitely("keys", null)
            return false
        })
    })

    /* Import Account */
    $(document).on('change.customBindings', '#encryptedAccount', function(data) {
        handleAccountUpload($("#encryptedAccount"), function(data) {
            newtables.importEncrypted(data, $("#passwordInput").val(), function(error) {
                if (error) {
                    popMsg("Incorrect Password")
                    loadPageExplicitely("import", null)
                } else {
                    popMsg("Sucessfully imported account")
                    newtables.settings.insert("loggedin", true, function() {
                        //location.href = "./"
                        loadPageExplicitely("keys", null)
                    })
                    
                }
            })
        })
        return false
    })

    /* Import Account from Modal Cloud */
    $(document).on('click.customBindings', '.importEncryptedDataModalCloud', function (data) {
        validateCredentials(function () {
            explorer.choose()
            $(".kloudless-modal").css("z-index", 2000)
            EmailLoginModal.close()
        }, function () {
            popMsg("Incorrect password")
            EmailLoginModal.close()
            setTimeout(function() { popLoginModalSelection() },500)
            
        })
    })
    
    /* Import Account from Cloud */
    $(document).on('click.customBindings', '.importEncryptedDataCloud', function (data) {
        newtables.settings.get("challenge", function (err, storedChallenge) {
            newtables.settings.get("email", function(err, setting) {
                //Register email and password
                var email = setting.value
                var password = me.password || $("#passwordInput").val()
                var decryptPassword = $("#passwordInput").val()
                if (email === "" || password === "") {
                    popMsg("Incorrect password")
                    EmailLoginModal.close()
                    popLoginModalSelection()
                }
                if (err) {
                    newtables.settings.insert("email", email, function () {
                        var encrypted = CryptoJS.AES.encrypt(email, password)
                        newtables.settings.insert("challenge", encrypted.toString(), function () {
                            me.password = decryptPassword
                            explorer.choose()
                            $(".kloudless-modal").css("z-index", 2000)
                            EmailLoginModal.close()
                        })
                    })
                } else {
                    var decrypted = CryptoJS.AES.decrypt(storedChallenge.value, password).toString(CryptoJS.enc.Utf8)
                    if (decrypted.toString() === email && email !== "") {
                        me.password = decryptPassword
                        explorer.choose()
                        $(".kloudless-modal").css("z-index", 2000)
                        EmailLoginModal.close()
                    } else {
                        popMsg("Incorrect Password")
                        EmailLoginModal.close()
                        popLoginModalSelection()
                    }
                }
            })
            
        })
    })

    /* Import Account Popup */
    $(document).on('click.customBindings', '.importEncryptedDataButton', function (data) {

        function doHandleUpload() {
            handleAccountUpload($("#encryptedAccountFileInput"), function (data) {
                newtables.importEncrypted(data, me.password, function (error) {
                    /*newtables.settings.insert("password", me.password, function (setting) {
                        if (error) {
                            popMsg("Incorrect Password")
                            popLoginModalSelection()
                        } else {
                            newtables.settings.insert("loggedin", true, function () {
                                popMsg("Sucessfully imported account")
                                location.href = "./"
                            })
                        }
                        FileLoginModal.close()
                    })*/
                    validateCredentials(function () {
                        newtables.settings.insert("loggedin", true, function () {
                            popMsg("Sucessfully imported account")
                            location.href = "./"
                        })
                    }, function () {
                       // popMsg("Incorrect Password")
                        //popLoginModalSelection()
            
                    })
                })
            })
        }

        newtables.settings.get("challenge", function (err, storedChallenge) {
            //Register email and password
            var email = $("#emailInput").val()
            var password = $("#passwordInput").val()
            if (email === "" || password === "") {
                popMsg("Incorrect password")
                FileLoginModal.close()
                popLoginModalSelection()
            }
            if (err) {
                newtables.settings.insert("email", email, function() {
                    var encrypted = CryptoJS.AES.encrypt(email, password)
                    newtables.settings.insert("challenge", encrypted.toString(), function() {
                        me.password = password
                        doHandleUpload()
                    })
                })
            } else {
                var decrypted = CryptoJS.AES.decrypt(storedChallenge.value, password).toString(CryptoJS.enc.Utf8)
                if (decrypted.toString() === email && email !== "") {
                    me.password = password
                    doHandleUpload()
                } else {
                    popMsg("Incorrect Password")
                    FileLoginModal.close()
                    popLoginModalSelection()
                }
            }
        })
        return false
    })
    
    /* Password onChange Export */
    $(document).on('keyup.customBindings', '#passwordExportInput', function(e) {
        if ($("#passwordExportInput").val() === "" && $("#passwordExportModalInput").val() === "") {
            $(".export-options").fadeOut()
        } else {
            $(".export-options").fadeIn()
        }
    })
    
    /* Password onChange Modal Export */
    $(document).on('keyup.customBindings', '#passwordExportModalInput', function (e) {
        if ($("#passwordExportModalInput").val() === "") {
            $(".export-options").fadeOut()
        } else {
            $(".export-options").fadeIn()
        }
    })
    
    /* Password onChange Import */
    $(document).on('keyup.customBindings', '#passwordInput', function (e) {
        if ($("#passwordInput").val() === "") {
            $(".import-options").fadeOut()
        } else {
            $(".import-options").fadeIn()
        }
    })

    /* Export Account */
    $(document).on('click.customBindings', '.exportEncryptedData', function (e) {
            newtables.exportEncrypted($("#passwordExportInput").val() || $("#passwordExportModalInput").val() || me.password, function (encrypted) {
                newtables.settings.insert("password", $("#passwordExportInput").val() || $("#passwordExportModalInput").val(), function(setting) {
                    me.password = $("#passwordExportInput").val() || $("#passwordExportModalInput").val()
                    var textToWrite = encrypted
                    var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
                    var fileNameToSaveAs = "circuits-of-value-Full-Account-Backup.txt"

                    var downloadLink = document.createElement("a");
                    downloadLink.download = fileNameToSaveAs;
                    downloadLink.innerHTML = "Download File";
                    if (!is_firefox) {
                        // Chrome allows the link to be clicked
                        // without actually adding it to the DOM.
                        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                        downloadLink.click()
                    } else {
                        // Firefox requires the link to be added to the DOM
                        // before it can be clicked.
                        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                        //downloadLink.onclick = destroyClickedElement;
                        downloadLink.style.display = "none";
                        document.body.appendChild(downloadLink);
                    }
                })        
        })
    })
    
    /* Export To Cloud Account with Picker */
    $(document).on('click.customBindings', '.exportEncryptedDataToCloud', function (e) {
            var password = $("#passwordExportInput").val() || me.password
            newtables.settings.insert("password", password, function(setting) {
                me.password = password
                exportToCloudWithPicker()
                return false
            })
        })
    
    /* Export To Cloud Account Modal with Picker */
        $(document).on('click.customBindings', '.exportEncryptedDataModalToCloud', function(e) {
            newtables.settings.insert("password", $("#passwordExportModalInput").val(), function(setting) {
                me.password = $("#passwordExportModalInput").val()
                if (FileExportModal !== undefined) {
                    FileExportModal.close()
                }
                exportToCloudWithPicker()
                return false
            })
        })
    
    function exportToCloudWithPicker() {
        newtables.exportEncrypted($("#passwordExportInput").val(), function (encrypted) {
            var textToWrite = encrypted
            var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
            var fileNameToSaveAs = "circuits-of-value-cloud-Full-Account-Backup.txt"
            
            var downloadLink = document.createElement("a");
            downloadLink.download = fileNameToSaveAs;
            downloadLink.innerHTML = "Download File";
            blobData = encrypted
            if (!is_firefox) {
                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
            }
            else {
                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                //downloadLink.onclick = destroyClickedElement;
                downloadLink.style.display = "none";
            }
            explorer.save([{
                    url: "http://wallet.ribbit.me/app/backup",
                    name: fileNameToSaveAs
                }])
            return false
        })
    }
    
    /* Login or Create Login Challange */
    $(document).on('click.customBindings', '.validateEmailPassword', function (e) {
        validateCredentials(function() {
            LoginPasswordModal.close()
            deferredLoad()
        }, function() {
            popMsg("Incorrect password")
            LoginPasswordModal.close()
            popLoginModalSelection()
        })
    })
    
    function validateCredentials(onSuccess, onFail) {
        var email = $("#emailInput").val()
        var password = $("input[type='password']").val()
        var name = $("#identityName").val()
        var lastName = $("#identityLastName").val()
        if (email === "" || password === "") {
            popMsg("Incorrect password")
            LoginPasswordModal.close()
            return popLoginModalSelection()
        }
        if (name === "") {
            return popMsg("Name is required.")
        }
        newtables.settings.get("challenge", function (err, storedChallenge) {
            //Register email and password
            if (err) {
				$.get('http://us8.api.mailchimp.com/2.0/lists/subscribe/?apikey=b9c46df8d6fe2d4ddb2a5a9ef78c8cc2-us8&id=897ca20a65&email[email]=' + email);
                newtables.settings.insert("name", name + "::" + lastName, function () {
                    newtables.settings.insert("email", email, function () {
                        var encrypted = CryptoJS.AES.encrypt(email, password)
                        newtables.settings.insert("challenge", encrypted.toString(), function () {
                            me.password = password
                            me.loggedin = true
                            onSuccess()
                        })
                    })
                });
                
            } else {
                var decrypted = CryptoJS.AES.decrypt(storedChallenge.value, password).toString(CryptoJS.enc.Utf8)
                if (decrypted.toString() === email && email !== "") {
                    me.password = password
                    me.loggedin = true
                    onSuccess()
                } else {
                    onFail()
                }
            }
        })
    }
    
    /*Export Account QR */
    $(document).on('click.customBindings', '.exportEncryptedQRData', function(e) {
        var uuid = guid() 
        generateQr(uuid)  //showQrModal(true)
        popMsg("Feature coming soon.")
        /*newtables.exportEncryptedLite($("#passwordExportInput").val(), function(encrypted) {
            generateQr(encrypted)
            showQrModal(true)
        })*/
    })

    /*Import Account QR */
    $(document).on('click.customBindings', '.importEncryptedData', function (e) {
        popMsg("Feature coming soon.")
    })

    /* Hometabs switch */
    $(document).on('click.customBindings', '.hometabs a', function(e) {
        e.preventDefault()
        $(this).tab("show")
    })

    /* Add a friend */
    $(document).on('click.customBindings', '.addFriend', function(e) {
        var address = $(this).attr("data")
        $(this).removeClass("fa-plus-circle").addClass("fa-minus-circle")
        makeFriend(address, function() {
            if (verbose) console.log("added: " + address)
        })
    })

    /* Remove a friend */
    $(document).on('click.customBindings', '.removeFriend', function(e) {
        var address = $(this).attr("data")
        $(this).removeClass("fa-minus-circle").addClass("fa-plus-circle")
        loseFriend(address, function() {
            if (verbose) console.log("removed: " + address)
        })
    })

    /* Sign and Send Transaction */
    $(document).on('click.customBindings', '#walletConfirmSend', function() {
        $("#modalWalletConfirm").modal("hide")
        if (bitcore.Networks.AvailableNetworks.currentNetwork().name === "ethereum"){
            handleConfirmEthereumSend()
        } else {
            addOutputToTransaction(function() {
                broadcastSignedTransaction(function(result){
                    resetTransaction()
                    renderWalletTemplate({})
                })
                
            })
        }
    })

    /* Save new address with name */
    $(document).on('change.customBindings', '#accountName', function() {
        if ($("#accountName").val() !== "") {
            newtables.privkey.newHD($("#accountName").val(), function(record) {
                loadAddressPicker()
                $("#accountName").val("")
                loadPageByHash()
                me.updateAddresses(function() {})
                canAutoSave(function(canAuto) {
                    if (canAuto) {
                        silentExportToCloud(function() {
                            //Do something after save
                        })
                    }
                })
            })
        }
        $("#nameAccountModal").modal("hide")

    })

    /* On Keyup Output Amount */
    $(document).on('keyup.customBindings', '.form-control.amount', function() {
        handleAmountInput()
    })

    /* Send chat into the world */
   /* $(document).on('change.customBindings', "#chatInput", function() {
        var target = $(this)
        var msg = target.val()
        $(this).val("")
        if (!settings.inFrame()) {
            var chat = new Chat({ "payload": msg })
            setTimeout(function() { chat.broadcast() }, 500)
        }
    })*/

    /* Play Onboard Image */ //(Depricated)
    $(document).on('click.customBindings', '.onboard', function(data) {
        var context = $(this)
        var target = $(this).attr("for")
        var nextTarget = $(this).attr("next")
        var nextContext = $("." + nextTarget).parent().parent().next().find(".onboard").fadeIn()
        var nextElement = $("." + nextTarget).parent().parent().next().find(".panel-heading")
        BootstrapDialog.show({
            message: "<img src='documentation/" + target + ".gif ' />",
            title: "Documentation",
            buttons: [
                {
                    label: 'Done',
                    cssClass: 'btn-primary',
                    action: function(dialog) {
                        dialog.close();
                        newtables.settings.getOrDefault("onboard", [], function(err, result) {
                            var stepsComplete
                            if (err) {
                                stepsComplete = []
                            } else {
                                stepsComplete = result.value
                            }
                            if (stepsComplete.indexOf({ target: target, panel: nextTarget }) === -1) {
                                stepsComplete.push({ target: target, panel: nextTarget })
                                newtables.settings.insert("onboard", stepsComplete, function() {
                                    if (nextElement.length === 0) {
                                        loadPageExplicitely("profile", null)
                                    } else {
                                        nextElement.removeClass("disabled")
                                        context.fadeOut()
                                        nextContext.fadeIn()
                                        nextElement.find(".skip-step").removeClass("disabled")
                                        $("." + nextTarget).find(".panel-heading").addClass("disabled")
                                    }
                                    $(".score").attr("src", "documentation/score-" + target + ".png")
                                })
                            }
                        })
                    }
                }
            ]
        })
        return false
    })

    /* Address Picker Actions */
    $(document).on('click.customBindings', '.wallet-address-picker .dropdown-menu .wallet-action', function(data) {
        if (this.text === "Generate new address") {
            $("#nameAccountModal").modal("show")
            return false
        }
    })
    
    $(document).on('click.customBindings', '.score', function (data) {
        loadPageExplicitely("training", null)
    })

    $(document).on('click.customBindings', '.manage-group .dropdown-menu a', function(data) {
        bitcore.Networks.AvailableNetworks.set(this.text.toLowerCase())
        insight = bitcore.Networks.AvailableNetworks.currentNetwork().insight
        $("#nameAccountModal").modal("show")
    })

    /*Click Edit Key Label*/
    $(document).on('click.customBindings', '.renameAccount', function() {
        $("#accountNameEdit").val($(this).attr("labelData"))
        $("#accountNameEdit").attr("keyData", $(this).attr("keyData"))
        $("#nameAccountEditModal").modal("show")
        return false
    })

    /* Edit Key Label */
    $(document).on('change.customBindings', '#accountNameEdit', function() {
        if ($("#accountNameEdit").val() !== "") {
            var key = $("#accountNameEdit").attr("keyData")
            newtables.privkey.get(key, function(a, b) {
                b.value.label = $("#accountNameEdit").val()
                //.privkey.insert(key, b.value, function(doc) {
                    $("#accountNameEdit").val("")
                loadPageByHash()
                    popMsg("Renaming of accounts is temporarily disabled")
                //})
            })
        }
        $("#nameAccountEditModal").modal("hide")

    })

    /*Click Show Key*/
    $(document).on('click.customBindings', '.viewPrivateKey', function() {
        var key = $(this).attr("keyData")
        generateQr(key)
        $("#modalQrcode").modal("show")
        return false
    })

    /*Click Delete Key*/
    $(document).on('click.customBindings', '.deleteKey', function() {
        var key = $(this).attr("keyData")
        var chain = $($("div[keydata='"+key+"']").siblings().get(0)).text().trim()
        if (chain === "ethereum") {
            key = $($("div[keydata='"+key+"']").siblings(".key-address").get(0)).text().trim()
        }
        newtables.privkey.remove(key, function () {
            canAutoSave(function (canAuto) {
                if (canAuto) {
                    silentExportToCloud(function() {
                        me.flushAddresses(function() {
                            loadPageByHash()
                        })
                    })
                } else {
                    me.flushAddresses(function () {
                        loadPageByHash()
                    })
                }
            })
        })
        return false
    })

    /* show QR modal */
    $(document).on('click.customBindings', '.qrButton', function(data) {
        $("#modalQrcode").modal("show")
        return false
    })
    
    /* show QR Account Import modal */
    $(document).on('click.customBindings', '.qrButtonImportAccount', function (data) {
        showQrScannerModal("#hiddenEncryptedData")
        return false
    })

    /* show QR Scanner Modal */
    $(document).on('click.customBindings', '.qrScanButton', function(data) {
        showQrScannerModal("#toAddress")
        return false
    })

    /* bind to send button */
    $(document).on('click.customBindings', '.send-now', function(data) {
        var shortCode = bitcore.Networks.AvailableNetworks.currentNetwork().insight.network.alias
        $("#modalWalletConfirm #spendAmount").text($("#amount").val() + " " + shortCode)
        $("#modalWalletConfirm").modal("show")
        $(".wallet-address-picker").removeClass("open")
        autoUtxo()
        return false
    })

    /* bind picker to the whole button */
    $(document).on('click.customBindings', '.wallet-address-picker', function(data) {
        $(this).addClass("open")
        $(".wallet-address-picker .address-view .ripple-wrapper").remove()
        return false
    })

    /* Add / Remove UTXO to/from transaction */
    $(document).on('click.customBindings', '.button-container a', function() {
        if ($(this).hasClass("hit")) {
            $(this).removeClass("hit")
            transaction.removeInput(Number(JSON.parse(JSON.parse($(this).data("index")))))
        } else {
            $(this).addClass("hit")
            transaction.from(JSON.parse(JSON.parse($(this).data("utxo"))))
        }
        $(".transaction-hash").val(transaction.toString())
        if (transaction.toString() === "01000000000000000000") {
            $(".transaction-hash-form").addClass("collapse")
        } else {
            $(".transaction-hash-form").removeClass("collapse")
        }
    })


    /* QR rewrite */
    $(document).on('click.customBindings', ".qrcodeBtn", function() {
        var address = $('.wallet-address-picker .address-view').text()
        if (settings.inFrame()) {
            generateQr(address)
            showQrModal()
        } else {
            generateQr(address)
            showQrModal()
        }
    })

    /*New address picker event binding (Click on an account) */
    $(document).on('click.customBindings', '.wallet-address-picker .dropdown-menu .address-item', function(data) {
        if ($(".address-view").html() !== "<span>Choose Account</span>") {
            var previouslySelected = $(".address-view").html()
            $(previouslySelected).insertBefore($(this).parent())
        }
        $(".accountInHeadBalance ").text($(this).find(".accountInPickerBalance").text())
        $(".balance-container").addClass("not-context")

        $(".current-balance-container-label").text($(this).find(".accountLabel").text())
        $(".address-view").html($(this).parent())
        $(".qrButton").removeAttr("disabled")
        var address = $(data.currentTarget).attr("data")
        $(".wallet-address-picker").removeClass("open")
        $(".dropdown-backdrop").remove()
        generateQr(address)        
        $("#receive").val(address)
        $(".request-info").css("display", "inline")
        $("#receive").css("font-size", "1.3em")
        loadSelectedAddressBalance()
        getUtxos(address)
        getHistory(address, function(history) {
            renderHistoryTemplate(history)
        })
        return false
    })
    
    /* Receive Input Change */
    $(document).on('keyup.customBindings', '#receive', function(data) {
        if ($("#receive").val() === "") {
            $("#receive").css("font-size", "3em")
        } else {
             $("#receive").css("font-size", "1.3em")
        }
    })

    /* Click manage key row */
    $(document).on('click.customBindings', '.manage.row', function(data) {
        
        var address = $(this).find(".key-address").text().trim();
        var label = $(this).find(".keys-label").text();
        var pk = $($(this).find("[keydata]")[0]).attr("keydata");
        var network = bitcore.Networks.AvailableNetworks.get($($(this).find(".key-network")[0]).text().trim())
        var coinAlias = network.alias
        var coinName = network.name
        var isIdentity = $($(this).find("[isIdentity]")[0]).attr("isIdentity");   
        handleCoinContextChangeByName(coinAlias, coinName)     
        executeCopy(address);
        renderManageTemplate({ address: address, label: label, pk: pk, isIdentity: isIdentity === "true" })
        getHistory(address, function(history) {
            renderHistoryTemplate(history)
        })
    })


    /* Monitor To Address */
    $(document).on('keyup.customBindings', '.toAddress', function() {
        var addressString = $(this).val()
        validateToAddress(addressString)
    })

    /* reset the transaction */
    $(document).on('click.customBindings', '.transaction-reset', function() {
        resetTransaction()
        var address = $(".address-view").text()
        getBalance(address)
    })

    /* Toggle */
    $(document).on('click.customBindings', '.togglebutton input', function() {
        handleToggleSettingAction($(this))
        //top.meshnet.publicIdentityCommand("update", function() {})
    })

    /* UI hotness */
    $(document).on('click.bs.radio.customBindings', '.btn-radio > .btn', function(e) {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
        handleIdentityViewType($(this))
    })

    /* On change (setting fields updated) */
    $(document).on('change.customBindings', "input[type='text'][for]", function() {
        toggleOn($(this))
        //top.meshnet.publicIdentityCommand("update", function() {
        //    top.matchPageSettingsToDatastore()
        //})
        top.matchPageSettingsToDatastore()
    })
    /* text area setting binding */
    $(document).on('change.customBindings', "textarea[for]", function() {
        toggleOn($(this))
        //top.meshnet.publicIdentityCommand("update", function() {
        //    top.matchPageSettingsToDatastore()
        //})

    })
    //TODO: Combine this and the method above
    $(document).on('keyup.customBindings', "input[type='text'][for]", function() {
        var target = $(this)
        handleProfileSaveButton()
        newtables.settings.insert(target.attr("for"), target.val(), function(doc) {
        })
    })
    $(document).on('keyup.customBindings', "textarea[for]", function() {
        var target = $(this)
        handleProfileSaveButton()
        newtables.settings.insert(target.attr("for"), target.val(), function(doc) {
        })
    })
}

function validateToAddress(addressString) {
    try {
        var address = top.bitcore.Address(addressString)
        newtables.peers.get(addressString, function (a, b) {
            $(".toImage").attr("src", photoObjectToUrl(b.value).photo)
        })
        if (address.network.name === top.bitcore.Networks.AvailableNetworks.currentNetwork().name 
                && $(".amount-warning").text().length === 0 
                && $(".amount").val() > 0) {
            setSubmitButtonDisabled(false)
        }
    } catch (e) {
        setSubmitButtonDisabled(true)
    }    
}

function getPrivateKeyFromStoredKey(key){
    var privkeyData
    try {
        privkeyData = JSON.parse(key).xprivkey
    } catch (e){
        privkeyData = key.xprivkey
    } finally{
        return privkeyData
    }
}

function loadBalance(balanceElement) {
    loadAddressPicker()
}

function loadAddressPicker() {
    var label = "Basic"
    var totalBalance = 0
    var identityIcon = ""
    var address, hd, gasLimit, gasPrice
    var balanceElement = $(".balance-container")
    var targetNetwork = bitcore.Networks.AvailableNetworks.currentNetwork().name
    var shortCode = bitcore.Networks.AvailableNetworks.currentNetwork().insight.network.alias
    $(".wallet-address-picker .dropdown-menu li.addressItem").remove()
    $(".address-view").html('<span>Choose Account</span>')
    
    newtables.privkey.allRecordsArray(function (records) {
        
        var handleRecord = function(value, callback){
            if (value.key.network.name === "ribbit") {
                value.key.network = bitcore.Networks.AvailableNetworks.get("coval")
            }
            address = null
            if (value.isIdentity) {
                identityIcon = "<i class=\" fa fa-star \" style='float: left'></i>"
            } else {
                identityIcon = ""
            }
            if (value.key.network === undefined || value.key.network.name !== "ethereum") {
                if (value.key.network === undefined) {
                    value.key.network = bitcore.Networks.AvailableNetworks.get("ethereum")
                }
                var privkeyData = getPrivateKeyFromStoredKey(value.key)
                hd = new bitcore.HDPrivateKey(privkeyData)
                address = hd.privateKey.toAddress()
            } else {
                hd = {}
                hd.privateKey = value.key.private
                address = value.key.address
            }
            
            var addressNetwork = value.key.network.name
            if (value.label !== undefined) {
                label = value.label
            }
            if (addressNetwork === "livenet") {
                addressNetwork = "bitcoin"
            }
            if (addressNetwork === targetNetwork) {                
                $('<li id="address-'+address+'" class="addressItem">'+ identityIcon +'<div key="'+ hd.privateKey +'" data="' + address + '" class="accountInPicker address-item"><div class="accountLabel">' + label + ' Account </div><span class="accountInPickerBalance"></span><div class="itemAddress">' + address + '</div></div>').insertBefore(".wallet-address-picker .dropdown-menu .divider");
                bitcore.Networks.AvailableNetworks.currentNetwork().insight.getBalance(address, function (err, balance) {
                    var keyTarget = $("div[data='" + address + "']")
                    var target = $(keyTarget).find(".accountInPickerBalance")
                    if (addressNetwork === "ethereum") {
                        $.ajax({
                            url : bitcore.Networks.AvailableNetworks.currentNetwork().insight.url+"/api/block-index/latest",
                            success : function (block) {
                                block = JSON.parse(block)
                                balance = balance * 0.000000000000000001
                                handleBalance(target, balance)
                                keyTarget.attr("gaslimit", block.gasLimit)
                                $.ajax({
                                    url : bitcore.Networks.AvailableNetworks.currentNetwork().insight.url+"/api/gas-price",
                                    success : function (price) {
                                        price = JSON.parse(price)                                        
                                        keyTarget.attr("gasprice", price)
                                        return callback()
                                    },
                                    dataType: "text",
                                    async : false
                                })  
                                //return callback()
                            },
                            dataType: "text",
                            async : false
                        })                        
                    } else {
                        balance = balance * 0.00000001
                        handleBalance(target, balance)
                        return callback()
                    }
                })                
            } else {
                return callback()
            }
        }
        
        var handleBalance = function(target, balance){
            target.html(numberWithCommas(parseFloat((balance).toString()).toFixed(4)) + " " + shortCode)
            if (balance > 0) {               
                totalBalance = totalBalance + balance
                target.addClass("positiveBalance")                        
            }
        }
        var handleRecordLoop = function(index, complete) {
            if (index >= records.length) {
                return complete()
            } else {
                handleRecord(records[index], function(){
                    if (verbose) console.log("at index", index)
                    index++
                    return handleRecordLoop(index, complete)
                })
            }          
        }
        
        balanceElement.text("Loading..." + " " + shortCode)
        handleRecordLoop(0, function(){
            balanceElement.text(numberWithCommas(parseFloat(totalBalance.toString()).toFixed(4) + " " + shortCode))
            console.log("done")
        })  
    })
}

function loadSelectedAddressBalance() {
    var targetNetwork = bitcore.Networks.AvailableNetworks.currentNetwork().insight.network.name
    var shortCode = bitcore.Networks.AvailableNetworks.currentNetwork().insight.network.alias
    var target = $(".address-view .address-item")
    var addressToLookup = target.attr("data")
    var balanceElement = target.find(".accountInPickerBalance")
    bitcore.Networks.AvailableNetworks.currentNetwork().insight.getBalance(addressToLookup, function(err, balance) {
        if (balance > 0) {
            balanceElement.addClass("positiveBalance")
        } else {
            balanceElement.removeClass("positiveBalance")
        }
        if (targetNetwork !== "ethereum") {
                balance = balance * 0.00000001
        } else {
            balance = balance * 0.000000000000000001
        }
        balanceElement.html(numberWithCommas(parseFloat((balance).toString()).toFixed(4)) + " " + shortCode)
    })
}

function handleProfileSaveButton() {
    var empty = []
    var state
    $.each($("input:text"), function () {
        if ($(this).val() === "") { empty.push($(this)) }
    })
    
    if (empty.length === $("input:text").length) { state = true }
    else {state = false}

    if (state) {
        $(".profileSaveButton span").text("Identity Information Required") 
        $(".profileSaveButton").removeClass("btn-primary").addClass("btn-warning").prop("disabled",true)
        $(".profileSaveButton i").removeClass("mdi-navigation-check").addClass("mdi-navigation-close")
        
    } else {
        $(".profileSaveButton span").text("Click to Save Profile")
        $(".profileSaveButton").addClass("btn-primary").removeClass("btn-warning").prop("disabled", false)
        $(".profileSaveButton i").addClass("mdi-navigation-check").removeClass("mdi-navigation-close")
    }
}

function toggleOn(elem) {
    var toggle 
    var preState
    if (elem.prop('tagName') === "DIV") { //Turn on
        prestate = false
        toggle = elem.parent().find("input[for='" + elem.attr("for") + "']")
    } else if (elem.val() === "") { //Turn off
        prestate = true
        toggle = $("input[for='" + elem.attr("for") + "']")
    } else { //Turn on
        prestate = false
        toggle = $("input[for='" + elem.attr("for") + "']")
    }
    toggle.prop("checked", prestate)
    toggle.click()
}

function showQrModal(hideTitle) {
    if (hideTitle !== null && hideTitle) {
        $("#modalQrcode .modal-title").hide()
    } else {
        $("#modalQrcode .modal-title").show()
    }
    $("#modalQrcode").modal("show")
}

function popCloudServicePicker(url) {
    $("#cloudConfirm").modal("show")
    $("#modalFrame").attr("src",url)
}

function showQrScannerModal(target) {
    QRScanload(function (scannedData) {
        $("#newModalQrcodeScanner").modal("hide")
        if (scannedData !== "error decoding QR Code") {
            $(target).val(scannedData.replace('bitcoin:', ''))
            $("[for='" + target.replace('#', '') + "']").fadeIn()
        } else {
            popMsg("Error decoding QR")
        }
    })
    $("#newModalQrcodeScanner").modal("show")
    if (mobileAndTabletcheck()) {
        setimg()
        $("#out-canvas").hide()
    }
}

/*function showQrScannerModal() {
    QRScanload(function (scannedData) {
        $("#newModalQrcodeScanner").modal("hide")
        $("#toAddress").val(scannedData.replace('bitcoin:', ''))
    })
    $("#newModalQrcodeScanner").modal("show")
}*/

$('#newModalQrcodeScanner').on('hidden', function () {
    camstream.close()
})

$(document).on('hide.bs.modal', '#newModalQrcodeScanner', function () {
    camstream.close()
});

function getUtxos(address) {
    var utxoSelector = ".wallet-utxo-picker"
    handleAmountInput()
    insight.getUnspentUtxos(address, function (err, utxos) {
        $(".button-container").html("")
        if (err) {
            if (verbose) console.log(err)
        } else {
            if (verbose) console.log("UTXOs")
            $.each(utxos, function (index, value) {
                $(".button-container").append("<a data-index='" + index + "' data-utxo='" + JSON.stringify(value) + "' >" + value.satoshis * 0.00000001 + " RBR</a>")
                if (verbose) console.log(value)
                //handleAmountInput()
            })
            if (verbose) console.log(utxos)
        }
    });
}

function getUtxosWithCallback(address, cb) {
    var utxoSelector = ".wallet-utxo-picker"
   
    insight.getUnspentUtxos(address, function (err, utxos) {
        $(".button-container").html("")
        if (err) {
            if (verbose) console.log(err)
            return cb(err)
        } else {
            if (verbose) console.log("UTXOs")
            $.each(utxos, function (index, value) {
                $(".button-container").append("<a data-index='" + index + "' data-utxo='" + JSON.stringify(value) + "' >" + value.satoshis * 0.00000001 + " RBR</a>")
                if (verbose) console.log(value)
                
                if (utxos.length === value -1) {
                    return cb(utxos)
                }                
            })
            if (verbose) console.log(utxos)
        }
    });
}



function addRule(sheet, selector, styles) {
    if (!sheet) return;
    if (sheet.insertRule) return sheet.insertRule(selector + " {" + styles + "}", sheet.cssRules.length);
    if (sheet.addRule) return sheet.addRule(selector, styles);
}

function switchCoinImage(coin,name) {
    var lastCoinElement = $("[data='" + coin + "']")
    var coinReplacing = $(".coinPicker").attr("data")
    if (coinReplacing === undefined || coin === undefined) {
        return
    }
    var coinReplacingName = $(".coinPicker").attr("name")
    if (coin === "rbr") {
        $(".coinPicker").css("background-size", "55px 55px;")
        /*$(".coinPicker:hover").css("background-size", "55px 55px;")*/
    } else {
        $(".coinPicker").css("background-size", "50px 50px;")
        /*$(".coinPicker:hover").css("background-size", "50px 50px;")*/
        $(".coinPicker").css("margin-left", "5px;")
        /*$(".coinPicker:hover").css("margin-top", "5px;")*/
    }
    $(".coinPicker").css("background-image", "url(./images/SVG/" + coin.toUpperCase() + ".svg)")
    //$(".canvas:after").css("background-image", "url(./images/SVG/" + coin.toUpperCase() + ".svg)")
    addRule(document.styleSheets[0], ".canvas:after", "background-image: url(../images/SVG/" + coin.toUpperCase() + ".svg)");
    $(".coinPicker").attr("data", coin)
    $(".coinPicker").attr("name", name)

    lastCoinElement.css("background-image", "url(./images/SVG/" + coinReplacing.toUpperCase() + ".svg)")
    if (coinReplacing === "rbr") {
        lastCoinElement.css("background-size", "55px 55px;")
    } else {
        lastCoinElement.css("background-size", "50px 50px;")
    }
    lastCoinElement.attr("data", coinReplacing)
    lastCoinElement.attr("name", coinReplacingName)
}

function toggleCoinSelection() {
    if ($(".coin-menu").is(":visible")) {
        $(".coin-menu").hide()
    } else { $(".coin-menu").show() }
    
}

function hideCoinSelection() {
    $(".coin-menu").hide()
}

function handleAmountInput() {
    resetTransaction()
    var bonus = ""
    var amountField = $("#amount")
    var msg = ""
   /* if (bitcore.Networks.AvailableNetworks.currentNetwork().name) {
        bonus = " <a class='bonusRbrLink'>here</a> for ways to receive more RBR"
    }*/
    var total = Number($(".address-view .accountInPickerBalance").text().split(" ")[0])
    var value = Number(amountField.val())
    if (isNaN(value)) {
        msg = "Not a valid number."
        $("#amount").show()
        $("label[for='amount']").show()
    } else if (value > (total - 0.00010000) || value < 0.00000001 && amountField.val().length > 0) {
        setSubmitButtonDisabled(true)
        if (total === 0) {
            //$("#amount").hide()
            $("label[for='amount']").hide()
            msg = "Your balance is zero. Select an account with funds."
        } else {
            $("#amount").show()
            $("label[for='amount']").show()
            msg = "Must enter an amount between 0.00000001 and " + (total - 0.00010000) + "."
        }
    } else {
        msg = ""
        $("#amount").show()
        $("label[for='amount']").show()
        setSubmitButtonDisabled(false)
        amountField.next().text(amountField.next().attr("default"))
        var address = $($(".address-view div.itemAddress")[0]).text()
        getUtxosWithCallback(address, function(utxos){
            autoUtxo()            
        })
        
    }
    amountField.next().text(msg)

    /*if (msg.length > 0) {
        bonus = "Or click" + bonus
    } else {
        bonus = "Click"+ bonus
    }*/
    amountField.next().next().html(bonus)
}

function disableSpendFields() {
    $("#output-address").prop('disabled', true)
    $("#output-amount").prop('disabled', true)
    $(".transaction-reset").prop('disabled', true)
}

function resetTransaction() {
    transaction = new bitcore.Transaction()
    $(".transaction-hash").val(transaction.toString())
    $.each($(".utxo a"), function () {
        $(this).removeClass("hit")
    })
}

function setSubmitButtonDisabled(isDisabled) {
    var notAllowed
    if (!isDisabled && $("#toAddress").val().length > 0 && $("#amount").val().length > 0 ) {
        notAllowed = false
        $(".send-now").removeClass("btn-default").addClass("btn-primary")
    } else {
        notAllowed = true
        $(".send-now").addClass("btn-default").removeClass("btn-primary")
    }
    $(".send-now").prop('disabled', notAllowed)
}

function resetToAmountFields() {
    $("#toAddress").val("")
    $("#amount").val("")
    handleAmountInput()
}

function enableSpendFields() {
    $("#toAddress").prop('disabled', false)
    $("#amount").prop('disabled', false)
    $(".reset").prop('disabled', false)
}

function autoUtxo() {
    var utxo = $(".utxo a")
    var amount = $("#amount").val() * 100000000
    var utxoTotal = 0
    if (utxo.length === 0) { return console.log("No outputs to add") }
    if (amount === 0) { return console.log("Amount to spend is zero") }

    $.each(utxo, function () {
        if (utxoTotal >= amount) { return console.log("Done adding inputs") } //Done adding utxo
        utxoTotal += JSON.parse(JSON.parse($(this).attr("data-utxo"))).amount * 100000000
        this.click()
        if (verbose) console.log("TOTAL: " + utxoTotal)
    })
}

function handleConfirmEthereumSend(){
    var fromAddress = $("#to-choose-address li:not('ul li')").attr("id").replace('address-','')
    var toAddress = $("#toAddress").val()
    var amount = Number($("#amount").val())
    var gasLimit = Number($("div[data='"+fromAddress+"']").attr("gaslimit"))
    var gasPrice = Number($("div[data='"+fromAddress+"']").attr("gasprice"))
    CreateAndSignEthereumTransaction(fromAddress, toAddress, amount, gasLimit, gasPrice,  function(rawTx){        
        console.log("transaction broadcast result", rawTx)
        renderWalletTemplate({})
    })
}

function CreateAndSignEthereumTransaction(fromAddress, toAddress, amount, gasLimit, gasPrice, cb) {
    $.ajax({
        url : bitcore.Networks.AvailableNetworks.currentNetwork().insight.url+"/api/transaction-count/"+fromAddress,
        success : function (nonce) {
            var rawTx = {"nonce":nonce,"gasPrice":gasPrice.toString(16),"gasLimit":gasLimit.toString(16),"to":toAddress,"value":web3.toHex(web3.toWei(amount)),"data":""}
            transaction = new EthTx(rawTx)	
            newtables.privkey.decrypt(fromAddress, me.password, function(result){ 
                var privateKey = new Buffer(result, 'hex')
                transaction.sign(privateKey)
                broadcastSignedTransaction(function(data){
                    return cb(data)
                })
            })
        },
        dataType: "text",
        async : false
    })  
    
}

function addOutputToTransaction(cb) {
    var fromAddress = $(".wallet-address-picker div").attr("data")
    var toAddress = $("#toAddress").val()
    var amount = $("#amount").val() * 100000000
    var key
    try {
        transaction.to(toAddress, amount)
        transaction.change(fromAddress)
        var keydata = $(".wallet-address-picker div").attr("key")
        key = new bitcore.PrivateKey(keydata)
        transaction.sign(key)
        $(".transaction-hash").val(transaction.toString())
        if (transaction.isFullySigned()) {
            popMsg("Signed and verified")
        } else {
            popMsg("Transaction is not finished.")
        }
        return cb()
    } catch (e) {
        popMsg("Critical Error: " + e.message)
        cb()
    }
}

function broadcastSignedTransaction(cb) {
    try {
        if ((bitcore.Networks.AvailableNetworks.currentNetwork().name === "ethereum" && !transaction.verifySignature())) {
            if (verbose) console.log("forgot to sign")
            $(".transaction-add-output").click()
        } else {
            if (transaction.isFullySigned !== undefined && !transaction.isFullySigned()) {
                $(".transaction-add-output").click()
            }
        }
        if (bitcore.Networks.AvailableNetworks.currentNetwork().name === "ethereum") {
            $.ajax({
                url : 'http://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=0x'+transaction.serialize().toString('hex'),
                success : function (data) {
                    popMsg("Broadcast Success: " + data)
                    return cb(data)
                },
                dataType: "text",
                async : false
            });
        } else {
            insight.broadcast(transaction, function (err, result) {
                if (err) {
                    popMsg("Broadcast Error: " + err)
                    return cb(err)
                } else {
                    popMsg("Broadcast Success: " + result)
                    return cb(result)
                }
            })
        }
    } catch (e) {
        popMsg("Critical: " + e.message)
        return cb(e.message)
    }
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomChangeProfileImageStock(context) {
    
    var rnd = randomIntFromInterval(1, 94)
    context.css("background-image", "url(./images/avatars/characters_" + rnd + ".png)")
    top.$(".profile-item img").attr("src","")
    top.$(".profile-item img").css("background-image", "url(./images/avatars/characters_" + rnd + ".png)")
    newtables.settings.insert("profileImage", {location: "stock", id: rnd}, function(doc) {
        toggleOn(context)
        if (verbose) console.log(doc)
        //top.meshnet.publicIdentityCommand("update", function() {})
    })
}

function changeProfileImageStock(index) {
    newtables.settings.insert("profileImage", { location: "stock", id: index }, function (doc) {
        //meshnet.publicIdentityCommand("update", function () { })
    })
}

function showNav() {
    $(".collapsed").removeClass("collapsed").addClass("collapsable")
    setTimeout(function() {
        hideNav()
    },4500)
}

function hideNav() {
    $(".collapsable").removeClass("collapsable").addClass("collapsed")
}

/* CHAT  */
function addGroupChatMsg(payload) {
    var msg = payload.msg
    var address = payload.address
    newtables.peers.get(payload.address, function (err, data) {
        if (err) { return }
        var peer = new Peer(data)
        data = photoObjectToUrl(data.value)
        data.msg = escapeHtml(msg)
        peer.isMe(function (me) {
            var hdkey
            try {
                hdkey = bitcore.HDPrivateKey(JSON.parse(foundIdentity[0]).xprivkey)
            } catch (e) {
                hdkey = bitcore.HDPrivateKey(foundIdentity[0].xprivkey)
            }
            if (data.address === hdkey.privateKey.toAddress().toString()) {
                data.class = "self"
            } else {
                data.class = "other"
            }
                renderChatRow(data)
        })
    })
}

function showChat() {
    //popMsg("Stay tuned. coming Soon!")
    $(".chatTab").tab("show")
}

function showContent() {
    $(".frame-tab").tab("show")
}

/* register handlebar helpers */
function registerHandlebarHelpers() {
    Handlebars.registerHelper('toUpperCase', function(str) {
        return str.toUpperCase();
    });
    Handlebars.registerHelper('toCapital', function(str) {
        return str.capitalize();
    });
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

/* HandleBars compile Coin Select Template */
function renderCoinMenu() {
    
    var source = $("#coinSelect").html();
    var template = Handlebars.compile(source);
    var data = {}
    data.selectedAlias = "coval"
    data.selectedName = "coval"
    getChainIdsFromAvailableNetworks(function(chainIds){
        data.coins = chainIds.filter(function(a){ return a.name !== "coval" })
        $(".coinSelectMenuContainer").html(template(data));
    })
    
}

function renderSettingsTemplate(templateData) {
    getChainIdsFromAvailableNetworks(function(chainIds){
        var coinData = {}
        coinData.coins = chainIds
        $.ajax({
            url : './templates/settings.html',
            success : function (data) {
                var template = Handlebars.compile(data)
                console.log(coinData)
                animateOut(template(coinData), function () { })
            },
            dataType: "text",
            async : false
        });
    })
    
}

/* HandleBars compile template */
function renderChatModule() {
    var source = $("#chatModule").html();
    var template = Handlebars.compile(source);
    var data = {}
    $("#messagewindow.msgs").html(template(data));
}
/* HandleBars compile template */
function renderPeerChatModule() {
    var source = $("#peerModule").html();
    var template = Handlebars.compile(source);
    var data = {}
    $("#messagewindow.users").html(template(data));
}
/* HandleBars compile template */
function renderPeerRow(data, target) {
    locatePeerRow(data.address, function (row) {
        var source = $("#peerRow").html();
        var template = Handlebars.compile(source);
        if (row !== null) {
            $(row).remove()
        }
        data.name = data.name.replace('::',' ')
        $(target).append(template(data));
    })
}

/* HandleBars compile template */
function renderToolTip(data) {
    if (data.top === -40) {data.top = -80}
    var source = $("#toolTip").html()
    var template = Handlebars.compile(source)
    $(".toolTip").append(template(data))
}

/* HandleBars compile template */
function renderChatRow(data) {
    var source = $("#chatRow").html();
    var template = Handlebars.compile(source);
    var id = guid()
    if (continuationOfLastChat(data)) {
        var row = "<p id='"+id+"'>" + data.msg + "</p>"
        $(".discussion li .messages").last().append(row)
    } else {
        data.id = id
        $(".discussion").append(template(data))
    }
    renderSmartContent(id)
    scrollChat()
}

/* HandleBars compile Wallet template */
function renderWalletTemplate(templateData) {
    $.ajax({
        url : './templates/wallet.html',
        success : function (data) {
            var template = Handlebars.compile(data)
            animateOut(template(templateData), function() {
                loadAddressPicker()
                validateToAddress(templateData.to)
                setTimeout(function(){                    
                    renderSmartContent("to-choose-address")
                    renderSmartContent("from-choose-address")
                },1500)           
            })
        },
        dataType: "text",
        async : false
    });
}

/* HandleBars compile History template */
function renderHistoryTemplate(templateData) {
    $.ajax({
        url : './templates/history.html',
        success : function (data) {
            var template = Handlebars.compile(data)
            $("#history").html(template(templateData));
            complete()
        },
        dataType: "text",
        async : false
    });
}

/* HandleBars compile Manage template */
function renderManageTemplate(templateData) {
    $.ajax({
        url : './templates/manage.html',
        success : function (data) {
            var template = Handlebars.compile(data)
            $("#manage").html(template(templateData));
        },
        dataType: "text",
        async : false
    });
}

/* HandleBars compile wallet template */
function renderProfileTemplate() {
    getPublicIdentity(function (profile) {
        profile.name = profile.name.replace('::',' ')
        profile.photo = photoObjectToUrl(profile).photo
        
        $.ajax({
            url : './templates/profile.html',
            success : function (data) {
                var template = Handlebars.compile(data)
                animateOut(template(profile), function () {
                    //handleSettingsElementFromStore()
                })
            },
            dataType: "text",
            async : false
        })
    })
}

/* HandleBars compile keys template */
function renderKeysTemplate() {
    getChainIdsFromAvailableNetworks(function(chainIds){
        getMyKeys(function(rows) {
            var pageObject = {}
            pageObject.chainIds = chainIds
            pageObject.rows = rows.rows
            $.ajax({
                url : './templates/keys.html',
                success : function (data) {
                    var template = Handlebars.compile(data)
                    console.log(pageObject)
                    animateOut(template(pageObject), function () {
                        renderSmartContent("manage-account-panel")
                    })
                },
                dataType: "text",
                async : false
            })
        })
    })
}

/* Handlebars compile import template */
function renderImportTemplate(data) { 
    var payload = {}
    payload.incoming = data
    newtables.cloud.keys(function (result) {
        
        if (result === undefined || result == null || result.error || result.length < 1) {
            payload = getCloudFeedback(false, result, payload)
            payload.services = []
            renderTemplate(payload) 
        } else {
            payload = getCloudFeedback(true, result, payload)

            function checkEach(result, cb) {
                var cloudObjects = []
                $(result).each(function(key, value) {
                    var cloudObject = {}
                    isAbleToAutoSave(result[key], function(canAuto) {
                        cloudObject.canAuto = canAuto
                        cloudObject.service = result[key]
                        cloudObjects.push(cloudObject)
                        if (key + 1 === result.length) {
                            return cb(cloudObjects)
                        }
                    })
                })
            }
            checkEach(result, function(cloudObjects) {
                payload.services = cloudObjects
                renderTemplate(payload)    
            })
        }

        function renderTemplate(payload) {
            $.ajax({
                url : './templates/import.html',
                success : function (data) {
                    var template = Handlebars.compile(data)
                    animateOut(template(payload), function () { })
                },
                dataType: "text",
                async : false
            })
        }
    })
}

function canAutoSave(cb) {
    newtables.cloud.keys(function (services) {
        if (services.error || services.length === 0) { return cb(false) }
        else {return cb(true)}
        /*$(services).each(function (key, value) {
            var idx = key
            isAbleToAutoSave(services[key], function (canAuto) {
                if (canAuto) {
                    can = true
                }
                if (idx + 1 === services.length) {
                    return cb(can)
                }
            })
        })*/
    })
}

/* Handlebars compile Splash template */
function renderSplashScreenContent(data) {
    var target = $(".splash-inner")
    var source = $("#" + target.attr("for")).html()
    var template = Handlebars.compile(source)
    target.prepend(template(data))
}


function getCloudFeedback(wasSuccess, result, payload) {
    if (wasSuccess) {
        payload.warn = "success"
        payload.warnmsgClass = "info"
        payload.warntext = "You have " + result.length + " cloud account(s) activated for backups.<ol><li>It can take up to 10 minutes for auto save to recognize the manual upload.</li></ol>"
        return payload
    } else {
        payload.warn = "warning"
        payload.warnmsgClass = "danger"
        payload.warntext = "Remember; You have control of the contents of your wallet. The safest way to ensure your wallet is both securely stored and always up to date is by <ol><li> Connecting a cloud storage provider.</li><li> OR Manually saving a backup using the export form below. </li></ol>"
        return payload
    }
}

function renderHashTemplate(templateData) {
    $.ajax({
        url : './templates/'+ settings.onPage.simple + ".html",
        success : function (data) {
            var template = Handlebars.compile(data)
            animateOut(template, function () { })
        },
        dataType: "text",
        async : false
    });
}

function renderDynamicTemplate(page) {
    $.ajax({
        url : './templates/' + page + ".html",
        success : function (data) {
            var template = Handlebars.compile(data)
            animateOut(template, function () { })
        },
        dataType: "text",
        async : false
    });
}

function animateOut(template, cb) {
    //multiStageHelp = {}
    $("#frame").children().removeClass("fadeInUp").addClass("fadeOutUp")
    setTimeout(function() {
        $("#frame").html(template)
        loadFireComplete(cb)
    },500)
}

function locatePeerRow(address, cb) {
    var continueEach = true
    var peers = $("#messagewindow .peer")
    if (peers.length === 0) {
        return cb(null)
    }
    $.each(peers, function (i) {
        if (continueEach) {
            var found = $(this).find("[address='" + address + "']").get(0)
            if (found) {
                continueEach = false
                return cb($(this))
            }
            if (i === peers.length - 1) {
                return cb(null)
            }
        }
    })
}

function ifRelaySubscribeToBlockchains() {
    newtables.settings.get("relayNode", function (err, setting) {
        if (!err && setting.value) {
            pubsub.subscribeBlockchains()
        }
    })
}

/* CHAT */
function continuationOfLastChat(data) {
    return data.address === $(".discussion li").last().find("img[address]").attr("address")
}


function scrollChat() {
    $("#messagewindow.msgs").animate({ scrollTop: $("#messagewindow.msgs").prop("scrollHeight") - $("#messagewindow.msgs").height() }, 300);
}

function loseFriend(address, cb) {
    var peer = new Peer(address)
    peer.loseFriend(cb)
}

function makeFriend(address, cb) {
    var peer = new Peer(address)
    peer.makeFriend(cb)
}

function renderChatList() {
    newtables.peers.allRecords(function (rows) {
        $.each(rows, function () {
            /* Adjust Name */
            //console.log(this)
            if ((this.name === undefined && this.nickname === undefined) || (this.name === "" && this.nickname === "") ) {
                this.name = "Anonymous"
            } else if (this.name === undefined && this.nickname !== undefined) {
                this.name = this.nickname
            }
            /* Adjust Image */
            if (this.photo === undefined) {
                this.photo = "./images/profile.png"
            } else if (this.photo.location === undefined) {
                this.photo = "./images/profile.png"
            } else if (this.photo.location === "base64") {
                this.photo = this.photo.data
            } else if (this.photo.location === "stock") {
                this.photo = "./images/avatars/characters_" + this.photo.id + ".png"
            }
            if (this.online) {
                renderPeerRow(this, $("#messagewindow .peerlist .peers"))
            }
        })
    })
}


function photoObjectToUrl(data) {
    if (data === undefined) {
        data = {}
        data.photo = "./images/profile.png"
    } else if (data.photo === undefined) {
        data.photo = "./images/profile.png"
    } else if (data.photo.location === undefined) {
        data.photo = "./images/profile.png"
    } else if (data.photo.location === "base64") {
        data.photo = data.photo.data
    } else if (data.photo.location === "stock") {
        data.photo = "./images/avatars/characters_" + data.photo.id + ".png"
    }
    return data
}

function escapeHtml(html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
}

//http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1]);
}

//TODO: Add to multi blockchain
function getHistory(address, cb) {
    var debug = true
    var history = {}
    try {
        bitcore.Networks.AvailableNetworks.set(bitcore.Address(address).network.name)
        insight = bitcore.Networks.AvailableNetworks.currentNetwork().insight    
        history.rows = []
        insight.request({ uri: insight.url+"/api/txs/?address="+address }, function(err, out) {
            var transactions = JSON.parse(out.response).txs
            $(transactions).each(function(i,elem) {
                var transaction = elem
                var inputs = transaction.vin
                var outputs = transaction.vout
                $(inputs).each(function (i, elem) {
                    var input = elem
                    switch (input.addr === address) {
                        case false:
                            return elem.txtype = "Received"                        
                        case true:
                            return elem.txtype = "Spent"
                    }
                }).promise().done(function (obj) {
                    var item = $(obj)[0]
                    var row = {}
                    row.alias = insight.network.alias.toUpperCase()
                    row.network = insight.network.name
                    row.type = item.txtype
                    row.id = transaction.txid
                    row.date = new Date(transaction.time * 1000).toLocaleString()
                    if (debug) row.raw = transaction /* Debug */
                    $(outputs).each(function(i, elem) {
                        var output = elem
                        return elem.mine = output.scriptPubKey.addresses[0] === address                        
                    }).promise().done(function (obj) {
                        var item = $(obj)[0]
                        row.amount = Number(item.value)
                        if (row.type === "Spent") {
                            row.fee = transaction.fees
                            row.finalValue = row.amount + row.fee
                        } else {
                            row.finalValue = row.amount
                        }
                        history.rows.push(row)
                    })
                })
            }).promise().done(function (obj) {
                return cb(history)
            })
        })
    } catch(e) {
        
    }
}
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var LoginModal
function popLoginModalSelection() {
    me.data.settings.get("loggedin", function (err, setting) {
        var cloudButton = {
            label: 'Login from Cloud',
            cssClass: 'btn-primary  login-cloud',
            action: function (dialogItself) {
                dialogItself.close()
                popEmailLoginModal()
            }
        }
        
        var importButton = {
            label: 'Login from File',
            cssClass: 'btn-primary login-file',
            action: function (dialogItself) {
                dialogItself.close()
                popFileLoginModal()
            }
        }
        
        var newAccount = {
            label: 'New Account',
            cssClass: 'btn-primary btn-lg login-newaccount',
            action: function (dialogItself) {
                popLoginPasswordModal()
                dialogItself.close()
                //popMsg("New account creation is temporarily closed.")
            }
        }
        
        var login = {
            label: 'Currently Logged in. Click to Unlock',
            cssClass: 'btn-primary login-unlock',
            action: function (dialogItself) {
                popLoginPasswordModal()
                dialogItself.close()
            }
        }
        if (location.hash.indexOf("import") > -1) {
            location.href = location.href.replace('#import', '')
        }
        if (location.hash.indexOf("chat") > -1) {
            location.href = location.href.replace('#chat', '')
        }
        if (err || !setting.value) {
            LoginModal = BootstrapDialog.show({
                message: 'Welcome. Please select how you would like to continue',
                title: "LOGIN",
                closable: false
            })
            newtables.settings.get("challenge", function(err, setting) {
                if (err) {
                    LoginModal.addButton(newAccount)
                    LoginModal.addButton(importButton)
                    if (!inElectron) {
                        LoginModal.addButton(cloudButton)
                    }
                } else {
                    LoginModal.addButton(login)
                }
                LoginModal.addButton(getModalHelpButton())
                LoginModal.updateButtons()
            })
            LoginModal.open()
            setTimeout(function() {
                setOverlay(".login-unlock", "Your account wasn't logged out. For your protection it has been locked.", "bottom")
                //setOverlay(".login-newaccount", "If this is your first time here try this.", "bottom")
                setOverlay(".login-file", "Would you like to restore an account from a file backup? <br> <br> (Requires a file backup or E-mail backup.)", "bottom")
                setOverlay(".login-cloud", "Would you like to restore an account from a cloud service?  <br> <br> (Requires a previously backed up account into a cloud service.)", "bottom")
                
                var cookie = getCookie("newuser-login1")
                console.log(cookie)
                if (cookie === null || cookie === "true") {
                    console.log("is new")
                    setCookie("newuser-login1", false)
                    /*setTimeout(function () { $(".help-button").click() }, 500)*/
                } else { }
                
            }, 500)

        } else {
            //popMsg("You did not log out previously.")
            popLoginPasswordModal(function() {
                setTimeout(function () { $(".splash").fadeOut() }, 100)
            })
        }
    })
    
}

function setOverlay(selector, msg, location) {
    $(selector).attr("data-intro", msg)
    $(selector).attr("data-position", location)
}

function unsetOverlay(selector) {
    $(selector).attr("data-intro", null)
    $(selector).attr("data-position", null)
}

var EmailLoginModal
function popEmailLoginModal() {
    EmailLoginModal = BootstrapDialog.show({
        closable: false,
        message: $('<div></div>').load('templates/loginCloudEmailPassword.html'),
        buttons: [
            {
                label: 'Import from Cloud',
                cssClass: 'btn-primary importEncryptedDataModalCloud'
            }, {
                label: 'Cancel',
                cssClass: 'btn-primary',
                action: function (dialogItself) {
                    newtables.settings.insert("loggedin", false, function () {
                        dialogItself.close()
                        popLoginModalSelection()
                    })
                }
            }
        ]
    })
    handleNameDisplayOnLoginModal()
}

var FileLoginModal
function popFileLoginModal() {
    FileLoginModal = BootstrapDialog.show({
        closable: false,
        message: $('<div></div>').load('templates/uploadEncryptedBackup.html'),
        buttons: [{
                label: 'Import file',
                cssClass: 'btn-primary importEncryptedDataButton'
            }, {
                label: 'Cancel',
                cssClass: 'btn-primary',
                action: function (dialogItself) {
                    newtables.settings.insert("loggedin", false, function () {
                        dialogItself.close()
                        popLoginModalSelection()
                    })
                }
            }]
    })
    handleNameDisplayOnLoginModal()
}

var FileLogoutConfirmModal

function popFileLogoutConfirmModal() {
    if (FileLogoutConfirmModal !== undefined && FileLogoutConfirmModal !== null)  {return}
    FileLogoutConfirmModal = BootstrapDialog.show({
        closable: false,
        message: "Before you logout be sure to back your data",
        buttons: [{
                label: 'Export Backup File',
                cssClass: 'btn-primary',
                action: function (dialogItself) {
                    dialogItself.close()
                    popFileExportModal()
                    FileLogoutConfirmModal = null
                }
            }, {
                label: 'Continue Logging out',
                cssClass: 'btn-primary',
                action: function (dialogItself) {
                    logoutLocalAccount(dialogItself)
                }
            }, {
                label: 'Cancel',
                cssClass: 'btn-primary',
                action: function (dialogItself) {
                    dialogItself.close()
                    FileLogoutConfirmModal = null
                }
            },
            getModalHelpButton()
        ]
    })
    FileLogoutConfirmModal.setType(BootstrapDialog.TYPE_WARNING)
}

var FileExportModal
function popFileExportModal(returnToLogoutPopup) {
    if (returnToLogoutPopup === undefined) { returnToLogoutPopup = true }
    FileExportModal = BootstrapDialog.show({
        closable: false,
        message: $('<div></div>').load('templates/exportEncryptedFileForm.html'),
        buttons: [{
                label: 'Cancel',
                cssClass: 'btn-primary',
                action: function (dialogItself) {
                    dialogItself.close()
                    if (returnToLogoutPopup)
                        popFileLogoutConfirmModal()
                }
            }]
    })
    handleNameDisplayOnLoginModal()
}

var LoginPasswordModal
function popLoginPasswordModal(cb) {
   if (me.loggedin) {
        dialogItself.close()
        popLoginModalSelection()
        return
    }
   var login = {
        label: 'Unlock',
        cssClass: 'btn-primary validateEmailPassword'
    }
    /*var logout = {
        label: 'Not you? Logout',
        cssClass: 'btn-primary logout'
    }*/
    var cancel = {
        label: 'Cancel',
        cssClass: 'btn-primary',
        action: function (dialogItself) {
            newtables.settings.insert("loggedin", false, function () {
                dialogItself.close()
                popLoginModalSelection()
            })
        }
    }
    var newAccount = {
        label: 'New Account',
        cssClass: 'btn-primary validateEmailPassword submit'
    }
    
    LoginPasswordModal = BootstrapDialog.show({
        closable: false,
        message: $('<div></div>').load('templates/emailPasswordForm.html'),
        title: "Unlock currently logged in account for use."
    })
        
    // newtables.settings.get("name", function (error, setting) {
    //     var name
    //     if (error) {
    //     } else {
    //         name = setting.value
    //     }
        newtables.settings.get("name", function(err, setting) {
            var name
	var a=0;
            if (err) {
                LoginPasswordModal.addButton(newAccount);                
				
                setTimeout(function () {
                    setOverlay(".validateEmailPassword", "Click here to complete the signup proccess.", "bottom")
                    setOverlay("#emailInput", "A valid email is required. Your first backup will be delivered here.", "top")
                    var cookie = getCookie("newuser-login2b")
                    console.log(cookie)
                    if (cookie === null || cookie === "true") {
                        console.log("is new")
                        setCookie("newuser-login2b", false)
                        /*setTimeout(function () { $(".help-button").click() }, 500)*/
                    } else { }
                }, 500)
            } else {
                name = setting.value
                LoginPasswordModal.addButton(login)
                a=1;
                setTimeout(function () {
                    $("#emailPasswordInput").focus()
                    setOverlay(".validateEmailPassword", "For your protection your account was locked from use.  <br> <br>Please provide your email address and password to continue.", "bottom")
                    setOverlay(".logout-locked", "Do you want to log this user out?", "right")
                    var cookie = getCookie("newuser-login2a")
                    console.log(cookie)
                    if (cookie === null || cookie === "true") {
                        console.log("is new")
                        setCookie("newuser-login2a", false)
                        /*setTimeout(function () { $(".help-button").click() }, 500)*/
                    } else { }
                }, 500)
            }
            LoginPasswordModal.addButton(cancel)
            LoginPasswordModal.addButton(getModalHelpButton())
            LoginPasswordModal.updateButtons();

            LoginPasswordModal.updateMessage();
            LoginPasswordModal.open()
            if(a == 1)
            {
				var c = LoginPasswordModal.getMessage();
				console.log(c.children('#subscribe'));
				c.children('#subscribe').empty();
				
			}
            handleNameDisplayOnLoginModal(name)
            
        })
    //})
}

function getModalHelpButton() {
    return {
        label: 'Help',
        icon: 'glyphicon glyphicon-info-sign',
        cssClass: 'btn-info help-button',
        action: function() {
            $('body').chardinJs('start')
        }
    }
}

/* Unlock modal modifications */
function handleNameDisplayOnLoginModal(name) {
    var identity
    if (name !== undefined) {
        me.data.identity(function(identityObject) {
            identity = identityObject
            setTimeout(function() {
                $(".logout-locked").fadeIn()
                $(".bootstrap-dialog-footer-buttons").prepend("Logged in as: " + name.replace("::", " ") + "   ")
                name = name.split('::')
                $("#identityName").val(name[0])
                $("#identityLastName").val(name[1])
                $(".validateEmailPassword").append(" <i class=\"glyphicon glyphicon-lock\"></i>")
                $("#emailInput").val(identity.email)
            }, 500)
        })
    }
}

/* Export To Cloud Account silent */
function silentExportToCloud(cb) {
    var identity
    /*newtables.settings.get("password", function(err, setting) {*/

    newtables.identity(function(identityObj) {
        identity = identityObj
        identity.password = me.password
        newtables.exportEncrypted(identity.password, function(encrypted) {
            newtables.cloud.allRecordsArray(function(attached) {
                $(attached).each(function(key, value) {
                    var accountId = attached[key]
                    saveFile(accountId, identity.email, encrypted, function(data) {
                        popMsg("Saved Cloud Backup ")
                        return cb()
                    }, function() {
                        popMsg("Error saving Cloud Backup")
                        return cb()
                    })
                })
                /*var fileNameToSaveAs = identity.email + "-Ribbit.me-Full-Account-Backup.txt"

                var downloadLink = document.createElement("a");
                downloadLink.download = fileNameToSaveAs;
                downloadLink.innerHTML = "Download File";
                blobData = encrypted
                newtables.cloud.allRecordsArray(function(attached) {
                    $(attached).each(function(key, value) {
                        var accountId = attached[key]
                        search(accountId, fileNameToSaveAs, function(files) {
                            if (verbose) console.log(files)
                            if (files.length > 0) {
                                updateContents(accountId, files[0].id, function(data) {
                                    popMsg("Autosaved your account backup")
                                    return cb()
                                })
                            } else {
                                //popMsg("There is a problem with Autosaving your account backup")
                                return cb()
                            }
                        })
                    })
                })*/
            })
        })
    })
    /*})*/
}

/* Check is depricated */
function isAbleToAutoSave(account, cb) {
    return cb(true)
    /*newtables.cloud.get(account, function (err, accountobject) {
        if (err) {
            return cb(false)
        }
        var accountId = accountobject.value
        search(accountId, "Ribbit.me-Full-Account-Backup.txt", function (files) {
            if (files.length > 0) {
                return cb(true)
            } else {
                return cb(false)
            }
        })
    })*/
}

function importEncrypted(data) {
    newtables.settings.get("password", function (err, setting) {
        newtables.importEncrypted(data, $("#passwordInput").val() || me.password || setting.value, function(error) {
            if (error) {
                popMsg("Incorrect Password")
                loadPageExplicitely("import", null)
                LoginModal.open()
                //$(".splash").fadeOut()
            } else {
                newtables.settings.insert("loggedin", true, function() {
                    popMsg("Successfully imported account")
                    deferredLoad()
                    setTimeout(function() {
                        loadPageExplicitely("keys", null)
                        $(".splash").fadeOut()
                    },500)
                    
                })
                
            }
        })
    })
}

var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

function logoutLocalAccount(dialog) {
    if (dialog !== undefined && dialog !== null) {
        dialog.close()
    }
    newtables.destroy(function () {
        location.href = "../"
    })
}

function sendEmailConfirmIfNecessary() {
    var hdkey
    try {
        hdkey = bitcore.HDPrivateKey(JSON.parse(foundIdentity[0]).xprivkey)
    } catch (e) {
        hdkey = bitcore.HDPrivateKey(foundIdentity[0].xprivkey)
    }
    var privateKey = hdkey.privateKey
    var address = privateKey.toAddress().toString()

    newtables.settings.get("confirmed", function(err, setting) {
        if (err) {
            newtables.settings.insert("confirmed", false, function() {
                newtables.exportEncrypted(me.password, function(encrypted) {
                    var textToWrite = window.btoa(encrypted)
                    newtables.identity(function(identity) {
                        var name = identity.name.split("::")
                        /*$.ajax({
                            method: "POST",
                            url: 'http://wallet.ribbit.me/api/signup',
                            data: {
                                payload: {
                                    email: identity.email,
                                    name: name[0],
                                    lastName: name[1],
                                    encrypted: textToWrite,
                                    address: address
                                }
                            },
                            success: function (data) {
                                data = JSON.parse(data)
                                if (data.success) {
                                    return popMsg("Email backup sent")
                                } else {
                                    return popMsg(data.message + " " + data.reason)
                                    //return logoutLocalAccount()
                                }

                            },
                            dataType: "text",
                            async: false
                        });*/
                    })
                })
            })
        }
    })
}

function toggleChat(state) {
    if (state === undefined) {
        state = $("#chatwindow").attr("class")
    }
    
    switch (state) {
        case "open":
            open()
            break;
        case "closed":
            close()
            break;
        case "close":
            close()
            break;
    }
    
    function close() {
        $("#chatwindow").attr("class", "closed")
        $(".users").animate({
            width: '60px'
        }, 500);
        $(".peer .peer-name").css("display", "none")
        $(".peer .peer-name").attr("style", "")
        $(".peer .peer-name").next().css("display", "none")
        $(".peer .peer-name").next().attr("style", "")
        $(".msgs").animate({
            'margin-left': '65px'
        }, 500);
    }
    
    function open() {
        $("#chatwindow").attr("class", "open")
        $(".users").animate({
            width: '250px'
        }, 500);
        setTimeout(function () {
            $(".peer .peer-name").fadeIn()
        }, 450)
        setTimeout(function () {
            $(".peer .peer-name").next().fadeIn()
        }, 450)
        $(".msgs").animate({
            'margin-left': '260px'
        }, 500);
    }
}

function renderSmartContent(id) {
    $('#'+id).embedBlock({
        gdevAuthKey: 'AIzaSyCqFouT8h5DKAbxlrTZmjXEmNBjC69f0ts',
        videoWidth: 350,
        tweetOptions: {
            hideMedia: true
        },
        codeEmbedHeight: 600,
        link: true,
        linkTarget: '_blank',
        linkExclude: ['exe', 'app', 'jar', '.bat', '.cmd', '.lnk', '.pif', '.scr', '.vb', '.vbe', '.vbs', '.wsh'],
        docEmbed          : true,
        docOptions        : {
            viewText    : '<i class="fa fa-eye"></i> View PDF',
            downloadText: '<i class="fa fa-download"></i> DOWNLOAD'
        },
        //set false to embed images
        imageEmbed        : true,
        //set true to enable lightboxes for images
        imageLightbox     : false,
        //set false to embed audio
        audioEmbed        : true,
        //set false to show a preview of youtube/vimeo videos with details
        videoEmbed        : true,
        //set false to show basic video files like mp4 etc. (supported by html5 player)
        basicVideoEmbed   : true,
        locationEmbed       : true,
        mapOptions        : {
            //'place' or 'streetview' or 'view'
            mode: 'place'
        },
        //Instructs the library whether or not to highlight code syntax.
        highlightCode     : true,
        soundCloudOptions: {
            height      : 160,
            themeColor  : 'f50000',    //Hex Code of the player theme color
            autoPlay    : false,
            hideRelated : false,
            showComments: true,
            showUser    : true,        //Show or hide the uploader name, useful e.g. in tiny players to save space)
            showReposts : false,
            visual      : false,       //Show/hide the big preview image
            download    : false        //Show/Hide download buttons
        },
        vineOptions: {
            maxWidth: null,
            type: 'postcard',         //'postcard' or 'simple' embedding
            responsive: false         // whether to make the vine embed responsive
        }
    });
}

function terms(){
	BootstrapDialog.show({
		message: "<iframe data-intro='Please read these Terms of Use.' data-position='left' src = \"js/ViewerJS/#../../Digital Wallet Terms of Use.pdf \" width='724' height='1024' allowfullscreen webkitallowfullscreen></iframe>",
		title: "Please read and accept the Terms of Use before continuing",
		buttons: [{
				label: 'I Agree',
				cssClass: 'btn-primary',
				action: function (dialog) {
					dialog.close();
					$('#terms:enabled').prop('checked','enabled');

				}
			}, {
				label: 'Cancel',
				cssClass: 'btn-warning',
				action: function (dialog) {
					dialog.close();
					window.location = "../"
				}
			}]
	})	
}

function configureMultiStageHelp(perform, next, delay) {
    if (delay === undefined) {
        delay = 4000
    }
    return function() {
        /*var helpIcon = '<span class="bootstrap-dialog-button-icon glyphicon glyphicon-info-sign"></span>'
        var nextButton = "<button class='btn btn-info' style='position:absolute; top: 10px; left: 48%'> " + helpIcon + " Next</button>"*/
        perform()
        
        //$(".chardinjs-overlay").html(nextButton)
        /*setTimeout(function() {
            if (next >= multiStageHelp.step.length) {
                $('body').chardinJs('stop')
            } else {
                $('body').chardinJs('stop')
                multiStageHelp.step[next]()
            }
        }, delay)*/
    }
}

function executeCopy(text) {
    var input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = text;
    input.focus();
    input.select();
    document.execCommand('Copy');
    input.remove();
}

function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}



var express = require("express");
var fileuploader = require("express-fileupload");
var cloudinary = require("cloudinary").v2;
var mysql2 = require("mysql2");
var fs = require("fs");
var nodemailer = require("nodemailer");
const otpStore = {};





var app = express();
app.use(fileuploader());
app.use(express.static("public"));


// gemini connnect
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyBX-0Uh1T9tZf7ka3ZWRbpVzZ4AtKRz7Ko"); // api key of gemini on ai studio 
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });




app.use(express.urlencoded(true));



cloudinary.config({
    cloud_name: 'dm1ddw8hf',
    api_key: '558331671231718',
    api_secret: 'pIO26UDRWFr9tSpI_y8PA_jxaQQ'
});



app.listen(6754, function () {
    console.log("server started at port no. 6754")
})




// path of index file 
app.get("/", function (req, resp) {
    // console.log(__dirname);
    let path = __dirname + "/public/index.html";
    resp.sendFile(path);
})



//path of organisation detail 
app.get("/orgdetails-page", function (req, resp) {

    let path = __dirname + "/public/org-details.html";
    resp.sendFile(path);
});


//path of list  tournament page
app.get("/post-Tournament-page", function (req, resp) {
    let path = __dirname + "/public/post-Tournament.html";
    resp.sendFile(path);

});

//path of mange tournament page
app.get("/manage-tournament", function (req, resp) {
    let path = __dirname + "/public/tournament-manage.html";
    resp.sendFile(path);

});

//path of admin user control 
app.get("/user-control", function (req, resp) {
    let path = __dirname + "/public/admin-usercontrol.html";
    resp.sendFile(path);
})


// path of admin player details 
app.get("/player-details", function (req, resp) {
    let path = __dirname + "/public/admin-player.html";
    resp.sendFile(path);

})


// path of admin organiser details 

app.get("/organiser-details", function (req, resp) {
    let path = __dirname + "/public/admin-organiser.html";
    resp.sendFile(path);

})

//--------end of admin path-------------------------
//path of player detail page 

app.get("/playerdetails-page", function (req, resp) {
    let path = __dirname + "/public/player-profile.html";
    resp.sendFile(path);
});
//path of post event 

app.get("/explorevent-page", function (req, resp) {
    let path = __dirname + "/public/exploretournament.html";
    resp.sendFile(path);
});


//-----------path of payer dash is end here -----------------------------------

let dbConfig = "mysql://avnadmin:AVNS_J68UNWC0Cgkxzv836L5@mysql-2a4d8057-lakshyagoyal584.c.aivencloud.com:20103/defaultdb"
let conn = mysql2.createConnection(dbConfig);



conn.connect(function (err) {
    if (err == null) {
        console.log("sucessfully run !!");
    }
    else
        console.log(err.message);
})//conected to aiven 

//--------------start-------------------------------------------

app.get("/signup", function (req, resp) {
    let email = req.query.txtEmail;
    let pwd = req.query.txtPwd;
    let combo = req.query.combouser;
    // console.log(email + " " + pwd + " " + combo);

    conn.query("insert into user25 values(?,?,?,current_date(),1)", [email, pwd, combo], function (errKuch) {
        if (errKuch == null) {
            sendSignupEmail(email, combo);
            resp.send("signup sucessfully!!")
        }
        else
            resp.send(errKuch.message)
    })

})
function sendSignupEmail(recipientEmail, userType) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "lakshyagoyal584@gmail.com",
            pass: "eurnqvwdfuputxnd"
        }
    });
    let mailOptions = {
        from: ' "Team"<lakshyagoyal584@gmail.com>',
        to: recipientEmail,
        subject: "Welcome user To Tycons",
        html: `<p>CONGRATULATIONS! YOU SUCCESSFULLY SIGNED UP AS A <b>${userType}</b>.</p>  
       <p>We’re glad to have you on board. 🏆</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Signup email sent: " + info.response);
        }
    })

};


//In signup  we check the email is alerady taken or not 
app.get("/chk-email", function (req, resp) {

    conn.query("select * from user25 where email=?", [req.query.txtEmail], function (err, records) {
        if (records.length == 0)
            resp.send("email is available");
        else
            resp.send("Email already exist ");
    })
})



//----------------------------------------end of signup work  ------------------------

// login 
app.get("/login", function (req, resp) {
    let email = req.query.txtEmail2;
    let pwd = req.query.txtPwd2;
    // console.log(email + "br" + pwd);


    conn.query("select * from user25 where email=? and pwd=?  ", [email, pwd], function (err, allrecord) {


        if (allrecord.length == 0) {
            resp.send("Invalid");
        }

        else if (allrecord[0].stat == 1) {
            resp.send(allrecord[0].combo);//.utype
        }

        else
            resp.send("Blocked");

    });


})
//-----------------------------------forget password in login model--------------------------------
function generateOtp() {                                                   // Create a function of gentrate otp in which we used to generate 6 digit otp 
    return Math.floor(100000 + Math.random() * 900000).toString();
};

app.get("/request-otp", function (req, resp) {
    let email = req.query.email3Kuch;
    let confirmuser = req.query.userKuch;

    const otp = generateOtp();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes time to fill otp 

    otpStore[email] = { otp, expiry, confirmuser };  //save otp in memory 

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "lakshyagoyal584@gmail.com",
            pass: "eurnqvwdfuputxnd"
        }
    })

    let mailOptions = {
        from: ' "Team"<lakshyagoyal584@gmail.com>',
        to: email,
        subject: "YOUR OTP FOR RESET PASSWORD ",
        html: `<p>your opt for reset password is  <b>${otp}</b>.</p>   
       <p>It is Valid only for 5 minutes </p>`,
    }              //otp sent via email 

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            resp.send("otp not send ");
        } else {
            resp.send("OTP send sucessfully to your mail ");
        }
    })
});

app.get("/verification-otp", function (req, resp) {
    const email = req.query.email3Kuch;
    const otp = req.query.otp;
    const confirmuser = req.query.userKuch;



    const record = otpStore[email];
    if (!record) return resp.send("No OTP found. Request again.");
    if (Date.now() > record.expiry) return resp.send("OTP expired.");
    if (record.otp !== otp) return resp.send("Invalid OTP.");
    if (record.confirmuser !== confirmuser) return resp.send("User type mismatch.");

    // Verified
    resp.send("OTP verified. You can now reset your password.");

});

app.get("/Reset-password", function (req, resp) {

    let email = req.query.email3Kuch;
    let newpass = req.query.resetpassKuch;
    let confirmuser = req.query.userKuch;

    const record = otpStore[email];
    if (!record || record.confirmuser !== confirmuser) {
        return resp.send("Unauthorized or invalid session");
    }


    conn.query("update user25 set pwd=? where email=? and combo=? ", [newpass, email, confirmuser], function (errKuch, result) {

        if (errKuch == null) {
            if (result.affectedRows == 1) {

                delete otpStore[email];
                resp.send(" Password Reset ");
            }
            else
                resp.send(" Email and usertype not match or failed to reset otp  ");
        }
        else
            resp.send(errKuch.message);
    })
});

//-----------------  start of org details-------------------------------------

app.post("/orgdetails-page", async function (req, resp) {
    var picurl = "";
    try {
        if (req.files != null) {
            let fName = req.files.profilePic.name;
            let locationtosave = __dirname + "/public/picupload/" + fName;
            await req.files.profilePic.mv(locationtosave);

            await cloudinary.uploader.upload(locationtosave).then(function (picUrlResult) {
                picurl = picUrlResult.url;
                // console.log(picurl);
            });
        }
        else
            picurl = "nopic.jpg";
    }
    catch {
        console.log("cloudinary crash");
    }

    let email = req.body.txtEmail3;
    let organame = req.body.txtOrg;
    let regnumber = req.body.txtRig;
    let address = req.body.txtAdr;
    let city = req.body.txtCity;
    let sports = req.body.txtSport;
    let insta = req.body.txtInsta;
    let head = req.body.txtHead;
    let contact = req.body.txtNum;
    let otherinfo = req.body.textinfo;



    // resp.send(email +"<br>"+  organame+"<br>"+regnumber+"<br>"+ address+"<br>"+city+"<br>"+sports+"<br>"+insta+"<br>"+head+"<br>"+contact+"<br>"+picurl+"<br>"+otherinfo);
    // console.log(email +"<br>"+  organame+"<br>"+regnumber+"<br>"+ address+"<br>"+city+"<br>"+sports+"<br>"+insta+"<br>"+head+"<br>"+contact+"<br>"+picurl+"<br>"+otherinfo);

    conn.query("insert into organizer values(?,?,?,?,?,?,?,?,?,?,?)", [email, organame, regnumber, address, city, sports, insta, head, contact, picurl, otherinfo], function (errKuch) {
        if (errKuch == null)
            resp.send("profile complete");
        else
            resp.send(errKuch.message);
    })

});


// search in org details 
app.get("/search", function (req, resp) {

    let email = req.query.txtEmail3;

    conn.query("select * from organizer where email=?", [email], function (err, records) {
        if (records.length == 0)
            resp.send("no record ");
        else
            resp.json(records);
    })
})




// modify in org details 
app.post("/update-user", async function (req, resp) {

    var picurl = " ";// challenges: don't put picurl inside  try. So that's why our image gave a problem 
    try {

        if (req.files != null) {
            let fName = req.files.profilePic.name;
            let locationtosave = __dirname + "/public/picupload/" + fName;
            await req.files.profilePic.mv(locationtosave);

            await cloudinary.uploader.upload(locationtosave).then(function (picUrlResult) {
                picurl = picUrlResult.url;
                // console.log(picurl);
            });
        }
        else
            picurl = req.body.hipic;
        // console.log("Using old pic:", picurl);
    }
    catch {
        console.log("cloudinary crash");
    }
    //----------------------------------------------------------------------
    let email = req.body.txtEmail3;
    let organame = req.body.txtOrg;
    let regnumber = req.body.txtRig;
    let address = req.body.txtAdr;
    let city = req.body.txtCity;
    let sports = req.body.txtSport;
    let insta = req.body.txtInsta;
    let head = req.body.txtHead;
    let contact = req.body.txtNum;
    let otherinfo = req.body.textinfo;


    conn.query("update organizer set organame=?,regnumber=?,address=?,city=?,sports=?,insta=?,head=?,contact=?,picurl=?,otherinfo=? where email=?", [organame, regnumber, address, city, sports, insta, head, contact, picurl, otherinfo, email], function (err, result) {
        if (err == null) {
            if (result.affectedRows == 1)
                resp.send(" Thanks, data Modify");
            else
                resp.send("invalid email");

        }
        else
            resp.send(err.message);
    })
})

//------------------------------------------------------------------end of org details ----------------------------------------------------


// insert of data in post tournament 

app.get("/Tournament-page", function (req, resp) {

    let email = req.query.inputEmail;
    let hname = req.query.txtName;
    let mobile = req.query.txtPhone;
    let title = req.query.txtTitle;
    let tdate = req.query.txtDate;
    let ttime = req.query.txtTime;
    let address = req.query.inputAddress;
    let city = req.query.inputCity;
    let sports = req.query.inputSports;
    let maxage = req.query.inputMage;
    let minage = req.query.inputMinage;
    let rdate = req.query.inputDate;
    let fees = req.query.inputFee;
    let prize = req.query.inputprize;

    // console.log(email);


    conn.query("insert into tournaments values(null,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [email, hname, mobile, title, tdate, ttime, address, city, sports, maxage, minage, rdate, fees, prize], function (errKuch) {
        if (errKuch == null)
            resp.send("Tournament listed sucessfully!!")
        else
            resp.send(errKuch.message)
    })

});




// manage tounament part 


app.get("/do-fetch-all-users", function (req, resp) {
    let email = req.query.emailidKuch;

    conn.query("select * from tournaments where email=?", [email], function (err, allRecords) {
        resp.send(allRecords);
    })
})

//delete manage  tournament part 

app.get("/delete-one", function (req, resp) {
    // console.log(req.query.ridno)
    let rid = req.query.ridno;

    conn.query("delete from tournaments where rid=?", [rid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send(rid + " Deleted Successfulllyyyy...");
            else
                resp.send("Invalid rid");
        }
        else
            resp.send(errKuch);

    })
})

//----------end of organisation part ----------------------

// payer details part 





// to run gemini 
async function RajeshBansalKaChirag(imgurl) {
    const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    console.log(result.response.text())

    const cleaned = result.response.text().replace(/```json|```/g, '').trim();
    const jsonData = JSON.parse(cleaned);
    // console.log(jsonData);

    return jsonData

}
//----------change the dob--------------------------------------------

function convertToMySQLDateFormat(input) {
    // Check if input is in DD/MM/YYYY format
    const parts = input.split('/');
    if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return input; // fallback
}

//===end of change of format===========================

app.post("/Player-user", async function (req, resp) {
    var acardpicurl = "";
    var profilepicurl = "";
    let jsonData = [];

    try {
        if (req.files != null) {
            let fName = req.files.acardPic.name;
            let locationtosave = __dirname + "/public/picupload/" + fName;
            await req.files.acardPic.mv(locationtosave);

            await cloudinary.uploader.upload(locationtosave).then(async function (picUrlResult) {
                acardpicurl = picUrlResult.url;
                // console.log(acardpicurl);

                jsonData = await RajeshBansalKaChirag(acardpicurl);    // call the function that we write on next to it 


                // resp.send(jsonData);

            });
        }
        else
            acardpicurl = "nopic.jpg";
    }
    catch {
        // console.log("cloudinary crash");
    }


    try {
        if (req.files != null) {
            let fName = req.files.pprofilePic.name;
            let locationtosave = __dirname + "/public/picupload/" + fName;
            await req.files.pprofilePic.mv(locationtosave);

            await cloudinary.uploader.upload(locationtosave).then(function (picUrlResult) {
                profilepicurl = picUrlResult.url;
                // console.log(profilepicurl);
            });
        }
        else
            profilepicurl = "nopic.jpg";
    }
    catch {
        console.log("cloudinary crash");
    }




    let email = req.body.inputEmail1;
    // let rname= req.body.inputName;
    //  let DOB= req.body.inputBirth;
    // let gender =req.body.inputGender;
    let address = req.body.inputAdr;
    let contact = req.body.inputNum;
    let game = req.body.inputGame;
    let otherinfo = req.body.inputinfo;

    let formattedofDOB = convertToMySQLDateFormat(jsonData.dob);


    // resp.send(email +"<br>"+  acardpicurl+"<br>"+profilepicurl+"<br>"+ rname+"<br>"+DOB+"<br>"+gender+"<br>"+address+"<br>"+contact+"<br>"+game+"<br>"+otherinfo);
    // console.log(email +"<br>"+  acardpicurl+"<br>"+profilepicurl+"<br>"+ rname+"<br>"+DOB+"<br>"+gender+"<br>"+address+"<br>"+contact+"<br>"+game+"<br>"+otherinfo);

    conn.query("insert into players values(?,?,?,?,?,?,?,?,?,?)", [email, acardpicurl, profilepicurl, jsonData.name, formattedofDOB, jsonData.gender, address, contact, game, otherinfo], function (errKuch) {
        if (errKuch == null)
            resp.send("profile complete");
        else
            resp.send(errKuch.message);
    })

});

//======================================================================
app.post("/Playerupdate-user", async function (req, resp) {
    var acardpicurl = "";
    var profilepicurl = "";
    let jsonData = [];
    try {
        if (req.files != null) {
            let fName = req.files.acardPic.name;
            let locationtosave = __dirname + "/public/picupload/" + fName;
            await req.files.acardPic.mv(locationtosave);

            await cloudinary.uploader.upload(locationtosave).then(async function (picUrlResult) {
                acardpicurl = picUrlResult.url;
                // console.log(acardpicurl);
                jsonData = await RajeshBansalKaChirag(acardpicurl);
            });
        }
        else
            acardpicurl = req.body.Hipic2;
    }
    catch {
        console.log("cloudinary crash");
    }


    try {
        if (req.files != null) {
            let fName = req.files.pprofilePic.name;
            let locationtosave = __dirname + "/public/picupload/" + fName;
            await req.files.pprofilePic.mv(locationtosave);

            await cloudinary.uploader.upload(locationtosave).then(function (picUrlResult) {
                profilepicurl = picUrlResult.url;
                // console.log(profilepicurl);
            });
        }
        else
            profilepicurl = req.body.Hipic3;
    }
    catch {
        console.log("cloudinary crash");
    }




    let email = req.body.inputEmail1;
    // let rname= req.body.inputName;
    // let DOB= req.body.inputBirth;
    // let gender =req.body.inputGender;
    let address = req.body.inputAdr;
    let contact = req.body.inputNum;
    let game = req.body.inputGame;
    let otherinfo = req.body.inputinfo;


    let formattedDOB = convertToMySQLDateFormat(jsonData.dob);


    conn.query("update players set acardpicurl=?,profilepicurl=?,rname=?,DOB=?,gender=?,address=?,contact=?,game=?,otherinfo=? where email=?", [acardpicurl, profilepicurl, jsonData.name, formattedDOB, jsonData.gender, address, contact, game, otherinfo, email], function (errKuch) {
        if (errKuch == null)
            resp.send("Updated Sucessfully");
        else
            resp.send(errKuch.message);
    })

});


app.get("/player-search", function (req, resp) {

    let email = req.query.inputEmail1;

    conn.query("select * from players where email=?", [email], function (err, records) {
        if (records.length == 0)
            resp.send("no record ");
        else
            resp.json(records);
    })
});



app.get("/do-fetch-event", function (req, resp) {
    let city = req.query.cityKuch;
    let sport = req.query.sportKuch;
    let age = req.query.ageKuch;
    conn.query("select * from tournaments where city=? and sports=? and minage<=?", [city, sport, age], function (err, allRecords) {
        resp.send(allRecords);
    })

})


app.get("/do-fetch-all-cities", function (req, resp) {
    conn.query("select distinct city from tournaments", function (err, allRecords) {
        resp.send(allRecords);
    })
})

app.get("/do-fetch-all-sport", function (req, resp) {
    conn.query("select distinct sports from tournaments", function (err, allRecords) {
        resp.send(allRecords);
    })
})



app.get("/update-password", function (req, resp) {

    let email = req.query.email2Kuch;
    let pass = req.query.oldpassKuch;
    let newpass = req.query.newpassKuch;



    conn.query("update user25 set pwd=? where email=? and pwd=?", [newpass, email, pass], function (errKuch, result) {

        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send(" update password  Successfulllyyyy...");
            else
                resp.send("Invalid rid");
        }
        else
            resp.send(errKuch);
    })
});


app.get("/participate-tounament", function (req, resp) {

    let playerEmail = req.query.pEmailKuch;
    let tournamentId = req.query.tidKuch;
    let organizerEmail = req.query.orgEmailKuch;

    conn.query("insert into participations values(null,?,?,?)", [organizerEmail, tournamentId, playerEmail,], function (err) {

        if (err) {
            resp.send("error to save participation");

        }
        else {
            resp.send("Participation recorded sucessfully ");
        }

    })
});

app.get("/view-participants", function (req, resp) {

    let tournamentId = req.query.tournamentid;

    conn.query("select  players.email, players.rname, players.contact from  participations join players on participations.PlayerEmail = players.email  where  participations.tournamentid = ?", [tournamentId], function (err, result) {
        if (err) {
            resp.send("error to fetch participants");

        }
        else {
            resp.send(result);

        }
    });
});




//--------------end of player---------------------------------------


//--------for admin user control---------------------------------
app.get("/all-records", function (req, resp) {
    conn.query("select * from user25", function (err, results) {
        // resp.send(allRecords);
        if (err) {
            console.error(err);
            resp.send(err);
        } else {
            // console.log(results);
            resp.send(results);
        }
    });
});


app.get("/doBlock", function (req, resp) {
    let userMail = req.query.emailKuch;
    //col name Same as  table col name
    conn.query("update user25 set stat=0 where email=?", [userMail], function (err, result) {
        if (err == null) {
            if (result.affectedRows == 1)
                resp.send("Status block Successfulllyyyy");
            else
                resp.send("Inavlid User Id");
        }
        else
            resp.send(err.message);
    })
});

app.get("/Resume", function (req, resp) {
    let userMail = req.query.emailKuch;

    conn.query("update user25 set stat=1 where email=?", [userMail], function (err, result) {
        if (err == null) {
            if (result.affectedRows == 1)
                resp.send("Status Resume Successfulllyyyy");
            else
                resp.send("Inavlid User Id");
        }
        else
            resp.send(err.message);
    })
});




//-------------for player admin control---------------------------------------------

app.get("/player-records", function (req, resp) {
    conn.query("select * from players", function (err, results) {

        if (err) {
            console.error(err);
            resp.send(err);
        } else {
            // console.log(results);
            resp.send(results);
        }
    });
});


//-----------for organisation admin control-------------------------------

app.get("/organiser-records", function (req, resp) {
    conn.query("select * from organizer", function (err, results) {

        if (err) {
            console.error(err);
            resp.send(err);
        } else {
            // console.log(results);
            resp.send(results);
        }
    });
});
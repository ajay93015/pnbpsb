/*const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const qrcode = require('qrcode');
const session = require('express-session');

const app = express();
*/
import express from 'express';
import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();
import ejs from 'ejs';
import bodyParser from 'body-parser';
import qrcode from 'qrcode';
import session from 'express-session';
import { Octokit } from '@octokit/rest';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;



app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
//const { Octokit } = require("@octokit/rest");


/*
const octokit = new Octokit({
  auth: "noth",
});
*/
const owner = "ajay93015";
const repo = "mysite";
//const path = "data.json";
const branch = "main";


const requestpsb = new sqlite3.Database('psb.db');
let blockedd =93017516;
// Create user table if not exists
requestpsb.run(`CREATE TABLE IF NOT EXISTS passbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Full_Name TEXT,
    Mobile_No TEXT,
    Address TEXT,
    Quantity TEXT,
    Amount_per_Passbook TEXT,
    Total_Amount TEXT

)`);

let db = new sqlite3.Database('passbook.db');
db.run(`CREATE TABLE IF NOT EXISTS acopen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gender TEXT,
  relationship_name TEXT,
  full_address TEXT,
  full_address2 TEXT,
  City TEXT,
  full_name TEXT,
  cif_number TEXT,
  account_number TEXT,
  adhar_number TEXT,
  acopen TEXT,
  username TEXT
)`);

const deviceDB = new sqlite3.Database('device.db');

// Create user table if not exists
deviceDB.run(`CREATE TABLE IF NOT EXISTS passbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    device TEXT,
    status TEXT

)`);




// Database initialization
const userDB = new sqlite3.Database('user.db');

// Create user table if not exists
userDB.run(`CREATE TABLE IF NOT EXISTS acopen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
)`);


// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views/');

app.use((req,res,next)=>{
 // res.send(505);
  //res.end("site down | don't worry it will back with in few minutes");
  return next();
})
app.get('/',(req,res)=>{
  
  const text = 'upi://pay?pa=9301751642@ibl&pn=Ajay%20Vishwakarma';

// Options for QR code generation
const options = {
    errorCorrectionLevel: 'H', // High error correction level
    type: 'image/png', // Output type
    rendererOpts: {
        quality: 1 // Quality (0 to 1)
    }
};
userDB.all('SELECT * FROM acopen', [], (err, row) => {
const ajayusrall = row;

requestpsb.all(`SELECT * FROM passbook`,[], (err, pay) => {
const userpay = pay;

// Generate QR code as a data URI
qrcode.toDataURL(text, options, function(err, url) {
    if (err) throw err;
  const user = req.session.userId ;
  if(user != undefined){
	res.render('index',{
    user:user,
    url:url,
    ajusrall: ajayusrall,
    userpay:userpay
  })
}else{
const user = undefined;
res.render('home',{
  url:url,
  
user:user

})
    
    //console.log(url); // Output the data URI
}
});
  
  });
//userall  
  });

})


const sites = [
  "https://pnbpsb.onrender.com"
];
// Ping every 4 minutes (less than Glitch's 5-minute sleep)
setInterval(() => {
  sites.forEach(site => {
    axios.get(site)
       
      //.catch(err => console.log(`❌ Error pinging ${site}:`, err.message));
  });
}, 49000); // every 4 minutes


app.post('/payee',(req,res,next)=>{
  const {address,Quantity,mobile} = req.body;
  
  let date = new Date(), dd = date.getDate(), mm = date.getMonth() + 1, yyyy = date.getFullYear();
let formattedDate = `${dd < 10 ? "0" + dd : dd}-${mm < 10 ? "0" + mm : mm}-${yyyy}`;
  const total = formattedDate;
  
  requestpsb.run('INSERT INTO passbook (Mobile_No,Address,Quantity,Total_Amount) VALUES (?,?,?,?)', [mobile,address,Quantity,total], (err) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
    res.redirect('/')
  })
})
app.get('/process',(req,res)=>{
  res.redirect('/');
})
app.get('/passbook',(req,res)=>{

 if(req.session.userId == undefined){
    res.redirect('/')
   }else{
db.all(`SELECT * FROM acopen WHERE username = ?`,[req.session.userId],(err, rows) => {
//  console.log(rows)
  db.all(`SELECT * FROM acopen`, (err, ro) => {//console.log(ro)
  if (rows != undefined) {
  res.render('fetch',{
    data:rows,
    user:req.session.userId,
    row:rows.username,
    ro:ro
  })

}else{
   res.render('fetch',{
    data:undefined,
    user:undefined
   })
}
  
});

})
     
}
})

const paybydb = new sqlite3.Database('./paydb.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        // Create table if not exists
        paybydb.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            amount REAL,
            txnid TEXT,
            user TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Routes
// GET /payment - Show QR and UTR input form
app.get('/payment', (req, res) => {
    res.render('payment');
});

// POST /payment - Receive payment message
app.post('/payment', (req, res) => {
	console.log(req.body.message);
    const { message } = req.body;
	
	console.log(message);
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Extract amount and txnid from message
    const amountMatch = message.match(/Rs\.(\d+(?:\.\d{2})?)/);
    const txnidMatch = message.match(/Txn ID:\s*(\w+)/);
    
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
    const txnid = txnidMatch ? txnidMatch[1] : null;

    // Insert into database
    paybydb.run(
        `INSERT INTO messages (message, amount, txnid) VALUES (?, ?, ?)`,
        [message, amount, txnid],
        function(err) {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            console.log('Message stored with ID:', this.lastID);
            res.json({ 
                success: true, 
                id: this.lastID,
                amount: amount,
                txnid: txnid
            });
        }
    );
});

// POST /verify - Verify UTR and update user
app.post('/verify', (req, res) => {
    const { utr, user } = req.body;
    
    if (!utr) {
        return res.json({  success: false, message: 'UTR is required' });
    }

    // Find message by txnid and update user
    paybydb.run(
        `UPDATE messages SET user = ? WHERE txnid = ? AND user = ''`,
        [user || '', utr],
        function(err) {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (this.changes === 0) {
                return res.json({ success: false, message: 'UTR not found Or Alerady Updated' });
            }
            
            res.json({ 
                success: true, 
                message: 'Verification successful',
                updated: this.changes
            });
        }
    );
});

// GET /messages - View all messages (optional for testing)
app.get('/messages', (req, res) => {
    paybydb.all(`SELECT * FROM messages ORDER BY created_at DESC`, (err, rows) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }
        res.render('messages', { messages: rows });
    });
});

app.post('/process',(req,res)=>{
  //var ajay = req.session.userId;
  //console.log(ajay);
  //( ajay != 7354199144)?res.redirect('/logout');

  const data = req.body;
  const accountNumber = req.body.account_number;
    db.get(`SELECT * FROM acopen WHERE account_number = ?`, [accountNumber], (err, rows) => {
      if (rows === undefined) {

  db.run(`INSERT INTO acopen (username,acopen,gender, relationship_name, full_address, full_address2, City, full_name, cif_number, account_number, adhar_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.session.userId,data.acopen,data.gender, data.relationship_name, data.full_address, data.full_address2, data.City, data.full_name, data.cif_number, data.account_number, data.adhar_number],
        function(err) {
          if (err) {
            return console.log(err.message);
          }
          //console.log(`A row has been inserted with rowid ${this.lastID}`);
        });

  res.render('process',{
    data:req.body,
    user:req.session.userId
  });

}else{

res.redirect(`/passbook/${req.body.account_number}`)
}

})

})

app.post('/passbook',(req,res)=>{
 if(req.session.userId == undefined){
    res.redirect('/')
   }else{
   const date = new Date();
  res.render('passbook',{
    print:req.body,
    user:req.session.userId
    
  })
}
})

//db.all(`SELECT * FROM acopen`, (err, rows) => {console.log(rows)});
app.get('/passbook/:accountNumber', (req, res) => {
    const accountNumber = req.params.accountNumber;

    // Select data from the table based on the account number
    db.get(`SELECT * FROM acopen WHERE account_number = ?`, [accountNumber], (err, rows) => {
      if (rows === undefined) {
            res.redirect('/');
        }else{
 if(req.session.userId == undefined){
    res.redirect('/')
   }else{
      res.render('passbook',{
    print:rows,
    user:req.session.userId

    
  })
    }
}
})
})


app.get('/update/:accountNumber', (req, res) => {
    const accountNumber = req.params.accountNumber;

    // Select data from the table based on the account number
    db.get(`SELECT * FROM acopen WHERE account_number = ?`, [accountNumber], (err, row) => {
        if (err) {
            return res.status(500).send('Database error');
        }

        if (!row) {  // If no record is found
            return res.redirect('/');
        }

        if (req.session.userId == undefined) {  // Check if user is authenticated
            return res.redirect('/');
        }

        // Render the update page with the data
        res.render('update', {
            print: row,           // Pass the selected row data to the template
            user: req.session.userId  // Pass the user session ID to the template
        });
    });
});
app.post('/update/:accountNumber', (req, res) => {
    const accountNumber = req.params.accountNumber;
    const { gender, relationship_name, full_address, full_address2, City, full_name, cif_number, adhar_number, acopen  } = req.body;

    // Update the record
    db.run(`UPDATE acopen 
            SET gender = ?, relationship_name = ?, full_address = ?, full_address2 = ?, City = ?, full_name = ?, cif_number = ?, adhar_number = ?, acopen = ?
            WHERE account_number = ?`, 
            [gender, relationship_name, full_address, full_address2, City, full_name, cif_number, adhar_number, acopen, accountNumber],
            function(err) {
                if (err) {
                    return res.status(500).send('Failed to update account');
                }
                res.redirect(`/update/${accountNumber}`);
            });
});


app.get('/login', (req, res) => {
   if(req.session.userId != undefined){
    res.redirect('/')
   }else{
    res.render('login', { error: req.session.loginError,
    user :undefined
     });
  }
});

app.get('/regaj', (req, res) => {
   if(req.session.userId != undefined){
    res.redirect('/')
   }else{
    res.render('registration', { error: req.session.regajError });
  }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
  if(req.body.username == '93017516'){
    res.redirect('/ero)');
    //res.end(`<h1>This site is blocked post method.</h1>`)
  }else{
    // Check if username exists
    userDB.get('SELECT * FROM acopen WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }

        if (!row || password != row.password) {
            // Invalid username or password
            req.session.loginError = 'Invalid username or password';
            return res.redirect('/login');
        }
       
        // Set session userId
        req.session.userId = row.username;
        res.redirect('/')
    });
  }
});
app.get('/device/login',(req,res)=>{
 // console.log(req.session.userId);
  const user = req.session.userId || undefined;
  res.render('device',{
    user:user
  });
})
app.get('/device/login/:device', (req, res) => {
  const device = req.params.device;

  deviceDB.get('SELECT * FROM passbook WHERE device = ?', [device], (err, row) => {
    if (err) {
      // Log and handle the query error, redirect to the homepage
      console.error(err);
      return res.redirect('/');
    }

    if (row) {
      // If the session userId is not set, set it to the username from the database
      if (req.session.userId == undefined) {
      
        req.session.userId = row.username;
    
      }
      // Redirect to the homepage, regardless of whether userId was set or not
     res.redirect('/');
    }

    // If no row is found in the database, redirect to the homepage
    
     return res.render('log2');
  });
});

app.get('/device/login/:address/:quantity', (req, res) => {
  const username = req.params.address;
  const device = req.params.quantity;

  deviceDB.get('SELECT * FROM passbook WHERE device = ?', [device], (err, row) => {
    if (err) {
      // Handle error with the query
      console.error(err);
      return res.redirect('/');
    }

    if (row) { 
      // If the user already exists in the passbook, redirect to device login page
      return res.redirect(`/device/login/${device}`);
    }

    // If the user doesn't exist, insert into the passbook
    deviceDB.run('INSERT INTO passbook (username, device, status) VALUES (?, ?, ?)', [username, device, 'A'], (err) => {
      if (err) {
        console.error(err);
        return res.redirect('/');
      }
      // Redirect to the homepage after successful insertion
      res.redirect('/');
    });
    
    
    
    
  });
});


app.post('/regaj', (req, res) => {
    const { username, password } = req.body;

    // Check if username already exists
    userDB.get('SELECT * FROM acopen WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }

        if (row) {
            // Username already exists
            req.session.regajError = 'Username already exists';
            return res.redirect('/regaj');
        }

        // If username does not exist, proceed with regaj
        const hashedPassword = password;
        userDB.run('INSERT INTO acopen (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }

            res.render('registration',{
              error:'Registration Success'
            });
        });
    });
});



app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.sendStatus(500);
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/agent',(req,res)=>{

  (req.session.userId == undefined)?
    res.redirect('/'):
    res.render("agent",{
      user:req.session.userId
    });;
})


app.get('/purches',(req,res)=>{

 res.render('purches',{
    user:req.session.userId,
    order:undefined
   })
})

app.post('/purches',(req,res)=>{
const {name,mobile,address,quantity,amount,total} = req.body;
  requestpsb.run('INSERT INTO passbook (Full_Name,Mobile_No,Address,Quantity,Amount_per_Passbook,Total_Amount) VALUES (?,?,?,?,?,?)', [name,mobile,address,quantity,amount,total], (err) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }

            res.render('purches',{
              user:undefined,
              order:'success'
            });
        });
})
/*
app.get("/adhar",(req,res)=>{
  res.render('aadhar',{
    
  })
})
*/

app.get("/adhar",(req,res)=>{
  (req.session.userId == undefined)?
    res.redirect('/'):
    res.render("adhar",{
      user:req.session.userId
    });;
})
app.post("/adhar",(req,res)=>{
const ekyc = req.body.kyc;
  (ekyc === "")?res.redirect('/'):"";
    const newData = `{${ekyc}}`;
const searchText = 'eKYCRespData';
const replaceText = '"eKYCRespData"';
const newfixeddata = newData.replace(searchText,replaceText);
const adhr = JSON.parse(newfixeddata);
const okdata = adhr.eKYCRespData.EKYCResponse.uidData;
//console.log(newfixeddata);
res.render('new',{
    name:okdata,
    user:req.session.userId
});
})

app.post("/aadhar",(req,res)=>{
    const ad = req.body;
    res.render('adhr',{
        ad:ad
    })
})

/*
async function syncGitHubToSQLite() {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    const content = Buffer.from(data.content, 'base64').toString('utf8');
    const jsonData = JSON.parse(content);

    for (const accountNumber in jsonData) {
      const record = jsonData[accountNumber];

      db.get(`SELECT * FROM acopen WHERE account_number = ?`, [accountNumber], (err, row) => {
        if (!row) {
          db.run(`
            INSERT INTO acopen (
              username, acopen, gender, relationship_name,
              full_address, full_address2, City, full_name,
              cif_number, account_number, adhar_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              record.username || '',
              record.acopen || '',
              record.gender || '',
              record.relationship_name || '',
              record.full_address || '',
              record.full_address2 || '',
              record.City || '',
              record.full_name || '',
              record.cif_number || '',
              accountNumber,
              record.adhar_number || ''
            ],
            (err) => {
              if (err) console.log("Insert error:", err.message);
            }
          );
        }
      });
    }

   // console.log("✅ Synced data.json from GitHub into SQLite");
  } catch (err) {
    console.error("❌ Error syncing from GitHub:", err.message);
  }
}
*/
app.use((req,res)=>{
    const text = 'upi://pay?pa=9301751642@ibl&pn=Ajay%20Vishwakarma&am=200';

// Options for QR code generation
const options = {
    errorCorrectionLevel: 'H', // High error correction level
    type: 'image/png', // Output type
    rendererOpts: {
        quality: 1 // Quality (0 to 1)
    }
};
  qrcode.toDataURL(text, options, function(err, url) {
  res.send(`<center>Pay And Sent UTR no. <br> <img src="${url}"> <br> <form action="/payee" method="post"><input name="Quantity" placeholder="UTR Number......"><input type="submit"></form>`)
  //res.redirect('/');
  });
})
// Run the server and report out to the logs
//const delay = 40 * 60 * 1000; // 40 minutes in milliseconds


app.listen(process.env.PORT || port);

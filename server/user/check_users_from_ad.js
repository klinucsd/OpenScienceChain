var ldap = require('ldapjs');
var assert = require('assert');

const server = "ad-onprem.s2.internal";
const userPrincipalName = "klin1@s2.internal";
const password = "cos(PI/4)=tan(PI)";
const adSuffix = "dc=s2,dc=internal";

let check_users_from_ad = (User) => {

    var client = ldap.createClient({
        url: `ldap://${server}`
    });

    console.log(`create client: ldap://${server} `);

    client.bind(userPrincipalName, password, err => {
        assert.ifError(err);
    });

    console.log("bind done");

    const options = {
        scope: 'sub',
        //filter: `(userPrincipalName=${userPrincipalName})`
        paged: true,
        sizeLimit: 500,
        filter: "(objectClass=person)"
    }

    let all_users = [];

    client.search(adSuffix, options, (err, res) => {

        assert.ifError(err);

        res.on('searchEntry', entry => {

            if (entry.object.memberOf) {
                //console.log("---------------------");
                //console.log(entry.object.memberOf);

                let found = false;
                if (entry.object.memberOf.length < 20) {
                    for (var i = 0; i < entry.object.memberOf.length; i++) {
                        let group = entry.object.memberOf[i];
                        if (group.startsWith('CN=COH-')) {
                            found = true;
                            break;
                        }
                    }

                    if (found) {
                        //console.log("\n-----------------------------------");
                        //console.log(JSON.stringify(entry.object));
                    }
                } else {
                    //console.log("======== OOPS");
                }


                /*
                if (found) {
                  console.log("====================");
                  console.log("mail: " + entry.object.mail);
                  console.log("name: " + entry.object.userPrincipalName);
                  console.log("cn: " + entry.object.cn);
                  console.log("sn: " + entry.object.sn);
                  console.log("givenName: " + entry.object.givenName);
                }
                */


                if (found && entry.object.givenName) {

                    let person = {
                        first_name: entry.object.givenName,
                        last_name: entry.object.sn,
                        email: entry.object.mail && entry.object.mail !== 'noemail_' ? entry.object.mail : entry.object.userPrincipalName,
                        role: 'user'
                    };

                    /*
                     if (!person.email.endsWith('@s2.internal')) {
                         all_users.push(person);
                         //console.log(JSON.stringify(person));
                     }
                    */
                    all_users.push(person);
                }
            }
        });

        res.on('searchReference', referral => {
            console.log('referral: ' + referral.uris.join());
        });

        res.on('error', function (err) {
            console.log('ERROR 200: ' + err.message);
            client.unbind();
        });

        res.on('end', function (result) {
            //console.log('status: ' + result.status  );
            client.unbind();

            all_users.forEach(user => {
                //console.log(JSON.stringify(user, null, 2));

                let query = {
                    where: {
                        email: user.email,
                    }
                };
                User.findOne(query)
                    .then(user => {
                        console.log(`Found: ${user.email}`);
                    })
                    .catch(err => {
                        console.log(`Not Found: ${user.email}`);
                        User.create(user);
                    });

            });
        });

    });

    client.unbind(err => {
        assert.ifError(err);
    });


}

module.exports = check_users_from_ad;

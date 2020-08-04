const express = require('express');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const pino = require('express-pino-logger')();
const path = require('path');
const moment = require('moment');

const getCondition = require('./query_condition');
const {
    getCaseIndicator,
    getCoditionForCancerEndpoint,
    getAnalysisStartDate,
    getEndOfFollowupDate,
    getDataGenerationCondition,
    getPrevalent
} = require('./data_generation_condition');

/* ---------------------------------
   setup database
-----------------------------------*/

const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './cts.sqlite',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

const User = sequelize.define(
    'User',
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        first_name: Sequelize.STRING,
        last_name: Sequelize.STRING,
        email: Sequelize.STRING,
        user_name: Sequelize.STRING,
        role: Sequelize.STRING,
        password: Sequelize.STRING,
    });

const Project = sequelize.define(
    'Project',
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.STRING,
        abbrev: Sequelize.STRING,
        study_design: Sequelize.STRING,
        endpoint: Sequelize.STRING,
        biospecimens: Sequelize.BOOLEAN,
        geospatial_data: Sequelize.BOOLEAN,
        data_sharing: Sequelize.BOOLEAN,
        cancer_endpoint: Sequelize.TEXT,
        start_of_follow_up: Sequelize.TEXT,
        censoring_rules: Sequelize.TEXT,
        questionnarie: Sequelize.TEXT
    });

User.belongsToMany(Project, {through: 'User_Project', as: 'projects'});
Project.belongsToMany(User, {through: 'User_Project', as: 'users'});

const seed = () => {
    return Promise.all([
        User.create({
            first_name: 'Normal',
            last_name: 'User',
            email: 'user@coh.org',
            role: 'user',
        }),
        User.create({
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@coh.org',
            role: 'admin',
            password: '1234',
        }),
        Project.create({
            name: 'Doe Breast Cancer Risk and Air Pollution',
            abbrev: 'DOEBCR',
            study_design: 'Cohort',
            endpoint: 'Cancer',
            biospecimens: true,
            geospatial_data: false,
            data_sharing: false,
        }),
        Project.create({
            name: 'Head and Neck Cancer Study',
            abbrev: 'HNCS',
            study_design: 'Case-Control',
            endpoint: 'Hospitalization',
            biospecimens: false,
            geospatial_data: true,
            data_sharing: false,
        }),
        Project.create({
            name: 'Lung Cancel Risk and Smoking ',
            abbrev: 'LCRS',
            study_design: 'Cross-Sectional',
            endpoint: 'Mortality',
            biospecimens: true,
            geospatial_data: true,
            data_sharing: false,
        })
    ]).then(([user, admin, DOEBCR, HNCS, LCRS]) => {
        return Promise.all([
            user.setProjects([DOEBCR, HNCS, LCRS]),
            admin.setProjects([DOEBCR, HNCS]),
        ]);
    }).catch(error => console.log(error));
};

/*
const users = require('../src/model/users');
const init = () => {
    for (var i = 0; i < users.length; i++) {
        //console.log(JSON.stringify(users[i]));
        User.create(users[i]);
    }
}
 */

sequelize.sync({force: false})
//.then(() => init())
//.then(() => seed())
    .then(() => User.findAll({include: [{model: Project, as: 'projects'}]}))
    .then(users => console.log(JSON.stringify(users)))
    .then(() => Project.findAll())
    .then(projects => console.log(JSON.stringify(projects)))
    .then(() => User.findOne({
        where: {id: 1},
        include: [{model: Project, as: 'projects'}]
    }))
    .then(user => {
        //console.log("------------------------------");
        //console.log(JSON.stringify(user.projects));
    })
    .then(() => Project.findOne({
        where: {id: 1},
        include: [{model: User, as: 'users'}]
    }))
    .then(project => {
        //console.log("------------------------------");
        //console.log(JSON.stringify(project.users));
        //project.users[0].setProjects([]);
        //project.setUsers([]);yec
    })
    .catch(error => console.log(error));


/* ---------------------------------
   setup Express
-----------------------------------*/

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(expressSession({secret: 'curiousjoe', resave: true, saveUninitialized: true}));
app.use(pino);
app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/api/ping', (req, res) => {
    if (req.session.user) {
        let user = {...req.session.user};
        user.password = undefined;
        res.json(user);
    } else {
        res.json({});
    }
});

app.get('/api/user', (req, res) => {
    let query = {
        include: [
            {model: Project, as: 'projects'},
        ],
        order: [
            ['last_name', 'ASC'],
            ['first_name', 'ASC'],
        ],
    }
    if (req.query.email) {
        query['where'] = {
            email: req.query.email
        }
    }
    User.findAll(query)
        .then(users => {
            for (var i = 0; i < users.length; i++) {
                users[i].password = undefined;
            }
            res.setHeader('Content-Type', 'application/json');

            if (users && users.length > 1) {
                if (req.session.user && req.session.user.role === 'admin') {
                    // only admin can see multiple users
                    res.send(JSON.stringify(users));
                } else {
                    res.json({Error: 'Not authenticated'});
                }
            } else {
                // single user
                if (users && users.length === 1 && users[0].role !== 'admin') {
                    req.session.user = users[0];
                }
                res.send(JSON.stringify(users));
            }
        })
});

app.post('/api/login', (req, res) => {
    let email = req.body.params.email;
    let password = req.body.params.password;
    let query = {
        include: [
            {model: Project, as: 'projects'},
        ],
    }
    query['where'] = {
        email: email,
        password: password
    };
    User.findOne(query)
        .then(user => {
            if (user) {
                req.session.user = user;
            }
            res.setHeader('Content-Type', 'application/json');
            res.json(user);
        })
});

app.post('/api/logout', (req, res) => {
    let email = req.body.params.email;
    if (req.session && req.session.user && req.session.user.email === email) {
        req.session.user = undefined;
        res.json({OK: true});
    }
});

app.get('/api/project', (req, res) => {
    let query = {
        include: [
            {model: User, as: 'users'},
        ],
        order: [
            ['name', 'ASC']
        ],
    }
    Project.findAll(query)
        .then(projects => {
            for (var j = 0; j < projects.length; j++) {
                for (var i = 0; i < projects[j].users.length; i++) {
                    projects[j].users[i].password = undefined;
                }
            }

            res.setHeader('Content-Type', 'application/json');
            if (req.session.user) {
                if (req.session.user.role === 'admin') {
                    res.json(projects);
                } else {
                    let output_projects = [];
                    for (var j = 0; j < projects.length; j++) {
                        var found = false;
                        for (var i = 0; i < projects[j].users.length; i++) {
                            if (projects[j].users[i].email === req.session.user.email) {
                                found = true;
                                break;
                            }
                        }
                        if (found) {
                            output_projects.push(projects[j]);
                        }
                    }

                    res.json(output_projects);
                }
            } else {
                res.json(projects);
            }
        })
});

app.post('/api/project/search', (req, res) => {

    if (req.session.user && req.session.user.role === 'admin') {
        let searchTerm = req.body.searchTerm;

        let query = {
            include: [
                {model: User, as: 'users'},
            ],
            order: [
                ['name', 'ASC']
            ],
        }
        Project.findAll(query)
            .then(projects => {
                let output_projects = [];
                for (var j = 0; j < projects.length; j++) {
                    for (var i = 0; i < projects[j].users.length; i++) {
                        projects[j].users[i].password = undefined;
                    }

                    if (searchTerm) {
                        if (projects[j].name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                            output_projects.push(projects[j]);
                        } else if (projects[j].abbrev.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                            output_projects.push(projects[j]);
                        } else if (projects[j].study_design.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                            output_projects.push(projects[j]);
                        } else if (projects[j].endpoint.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                            output_projects.push(projects[j]);
                        } else {
                            for (var i = 0; i < projects[j].users.length; i++) {
                                if (projects[j].users[i].first_name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                    output_projects.push(projects[j]);
                                    break;
                                } else if (projects[j].users[i].last_name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                    output_projects.push(projects[j]);
                                    break;
                                } else if (projects[j].users[i].email.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                                    output_projects.push(projects[j]);
                                    break;
                                }
                            }
                        }
                    } else {
                        output_projects.push(projects[j]);
                    }

                }
                res.setHeader('Content-Type', 'application/json');
                res.json(output_projects);
            })
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.json({Error: 'No permission to search projects'});
    }
});


app.post('/api/project', (req, res) => {

    if (req.session.user && req.session.user.role === 'admin') {
        let input_project = req.body;
        let preselected = {
            "Q1": {
                "age_at_baseline": true,
                "adopted": true,
                "twin": true,
                "birthplace": true,
                "birthplace_mom": true,
                "birthplace_dad": true,
                "participant_race": true,
                "nih_ethnic_cat": true,
                "age_mom_atbirth": true,
                "age_dad_atbirth": true,
                "menarche_age": true,
                "oralcntr_ever_q1": true,
                "oralcntr_yrs": true,
                "fullterm_age1st": true,
                "preg_ever_q1": true,
                "preg_total_q1": true,
                "meno_stattype": true,
                "height_q1": true,
                "weight_q1": true,
                "bmi_q1": true,
                "diab_self_q1": true,
                "hbp_self_q1": true,
                "allex_hrs_q1": true,
                "allex_life_hrs": true,
                "vit_mulvit_q1": true,
                "alchl_analyscat": true,
                "smoke_expocat": true,
                "smoke_totyrs": true,
                "smoke_totpackyrs": true,
                "cig_day_avg": true,
            }, "Q2": {}, "Q3": {}, "Q4": {}, "Q4mini": {}, "Q5": {}, "Q5mini": {}, "Q6": {}
        };
        input_project.questionnarie = JSON.stringify(preselected);
        Project.create(input_project).then(
            project => {
                if (req.body.users && req.body.users.length > 0) {
                    let conditions = [];
                    for (var i = 0; i < req.body.users.length; i++) {
                        conditions.push({id: req.body.users[i].id});
                    }
                    const {Op} = require("sequelize");
                    User.findAll({
                        where: {[Op.or]: conditions}
                    }).then(users => {
                        project.setUsers(users);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(project));
                    })
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(project));
                }
            }
        )
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.json({Error: 'No permission to create a new project'});
    }
});

app.get('/api/project/:id', (req, res) => {
    const id = req.params.id;
    Project.findOne({
        where: {id: id},
        include: [
            {model: User, as: 'users'},
        ],
    }).then(project => {

        if (project) {

            for (var i = 0; i < project.users.length; i++) {
                project.users[i].password = undefined;
            }

            res.setHeader('Content-Type', 'application/json');
            if (req.session.user) {
                if (req.session.user.role === 'admin') {
                    res.json(project);
                } else {
                    var found = false;
                    for (var i = 0; i < project.users.length; i++) {
                        if (project.users[i].email === req.session.user.email) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        res.json(project);
                    } else {
                        res.json([]);
                    }
                }
            } else {
                res.json([]);
            }
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json([]);
        }
    });
});


app.post('/api/summary/total', (req, res) => {

    let sql = 'SELECT count(DISTINCT SSAP_ID) as TOTAL FROM ssap_data_2 WHERE ' +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up, req.body.censoring_rules);

    if (
        (req.body.cancer_endpoint !== undefined &&
            req.body.cancer_endpoint !== null &&
            req.body.cancer_endpoint !== 'null' &&
            req.body.cancer_endpoint.length > 0)
        ||
        (req.body.start_of_follow_up !== undefined &&
            req.body.start_of_follow_up !== null &&
            req.body.start_of_follow_up !== 'null')
        ||
        (req.body.censoring_rules !== undefined &&
            req.body.censoring_rules !== null &&
            req.body.censoring_rules !== 'null')
    ) {
    } else {
        sql += " AND 1=0 ";
    }

    console.log("---------------------------");
    console.log(sql);

    sequelize.query(
        sql,
        {
            type: sequelize.QueryTypes.SELECT
        })
        .then(result => {
            res.json(result);
        });

});


app.post('/api/summary/diagnosis_age', (req, res) => {

    let sql = 'SELECT DISTINCT cast(strftime(\'%Y\', date(DATE_DT))as integer) as year,  ' +
        ' cast(round((julianday(DATE_DT)-julianday(DATE_OF_BIRTH_DT))/365.25)as integer) as age FROM ssap_data_2 WHERE ' +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up, req.body.censoring_rules) +
        //' AND DATE_DT <= \'2017-12-31\' ' +
        ' AND NOT DATE_DT = \'\' ORDER BY year, age';

    console.log("---------------------------");
    console.log(sql);

    sequelize.query(sql)
        .then(result => {

            //console.log("------------> size = " + result[0].length);

            let data = [];
            for (var i = 0; i < result[0].length; i++) {
                data.push([result[0][i].year, result[0][i].age]);
            }

            /*
            let displayed = [];
            let data = [];
            for (var i = 0; i < result[0].length; i++) {
                //console.log("data = " + JSON.stringify(result[0][i]));
                let diag_date_str = result[0][i].DATE_DT;
                let birthday_str = result[0][i].DATE_OF_BIRTH_DT;
                let diag_date = moment(diag_date_str, 'YYYY-MM-DD');
                let birthday = moment(birthday_str, 'YYYY-MM-DD');
                let age = Math.round(diag_date.diff(birthday, 'days') / 365.25);

                if (displayed.indexOf(diag_date.year()+"_"+age) === -1) {
                    data.push([diag_date.year(), age]);
                    displayed.push(diag_date.year()+"_"+age);
                }
            }
             */
            res.json(data);
        });

});


app.post('/api/summary/tumor_histology', (req, res) => {

    let sql = "SELECT (CASE HISTOLOGIC_ICDO3_TYP WHEN '' THEN 'Unknown' ELSE HISTOLOGIC_ICDO3_TYP END) AS HISTOLOGIC_ICDO3_TYP, count(*) AS TOTAL FROM ssap_data_2 WHERE NOT HISTOLOGIC_ICDO3_TYP='' AND  " +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up, req.body.censoring_rules) +
        " GROUP BY HISTOLOGIC_ICDO3_TYP";

    console.log("---------------------------");
    console.log(sql);

    sequelize.query(sql)
        .then(result => {
            //console.log("data = " + JSON.stringify(result));
            let data = [];
            for (var i = 0; i < result[0].length; i++) {
                //console.log("data = " + JSON.stringify(result[0][i]));
                let name = result[0][i].HISTOLOGIC_ICDO3_TYP;
                let y = result[0][i].TOTAL;
                data.push({name: name, y: y});
            }
            res.json(data);
        });

});

app.post('/api/summary/stage', (req, res) => {

    let sql = 'SELECT STAGE_SUM_IND AS STAGE_SUM_IND, count(*) AS TOTAL FROM ssap_data_2 WHERE ' +
        getCondition(req.body.cancer_endpoint, req.body.start_of_follow_up, req.body.censoring_rules) +
        ' GROUP BY STAGE_SUM_IND';

    console.log("---------------------------");
    console.log(sql);

    sequelize.query(sql)
        .then(result => {
            //console.log("data = " + JSON.stringify(result));
            let data = [];
            for (var i = 0; i < result[0].length; i++) {
                //console.log("data = " + JSON.stringify(result[0][i]));
                let name = result[0][i].STAGE_SUM_IND;
                switch (name) {
                    case '0':
                        name = 'In situ';
                        break;
                    case '1':
                        name = 'Localized';
                        break;
                    case '2':
                        name = 'Regional by direct extension';
                        break;
                    case '3':
                        name = 'Regional by lymph nodes';
                        break;
                    case '4':
                        name = 'Regional by direct extension and lymph nodes';
                        break;
                    case '5':
                        name = 'Regional, NOS';
                        break;
                    case '7':
                        name = 'Remote';
                        break;
                    case '8':
                        name = 'Not abstracted';
                        break;
                    case '9':
                        name = 'Unknown or not specified';
                        break;
                    default:
                        name = 'Unknown or not specified';

                }
                ;
                let y = result[0][i].TOTAL;
                data.push({
                    showInLegend: false,
                    name: name,
                    data: [y]
                });
            }
            res.json(data);
        });

});

app.delete('/api/project/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        const id = req.params.id;
        Project.destroy({where: {id: id}}).then(
            project => {
                res.setHeader('Content-Type', 'application/json');
                res.send({done: true});
            }
        )
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send({Error: 'No permission to delete this project.'});
    }
});

app.put('/api/project/:id', (req, res) => {
    if (req.session.user) {
        const id = req.params.id;
        const updates = req.body;
        Project.findOne({
            where: {id: id},
            include: [
                {model: User, as: 'users'},
            ],
        }).then(project => {
            return project.update(updates);
        }).then(updated_project => {
            if (req.body.users && req.body.users.length > 0) {
                let conditions = [];
                for (var i = 0; i < req.body.users.length; i++) {
                    conditions.push({id: req.body.users[i].id});
                }
                const {Op} = require("sequelize");
                User.findAll({
                    where: {[Op.or]: conditions}
                }).then(users => {
                    updated_project.setUsers(users);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(updated_project));
                })
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(updated_project));
            }
        });
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send({Error: 'No permission to update this project.'});
    }
});

app.post('/api/cancer_endpoints', (req, res) => {

    let sql =
        'SELECT SITE_GROUP_NME AS SITE_GROUP_NME, SEER_ID AS SEER_ID, ICD_O3_CDE AS ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP AS HISTOLOGIC_ICDO3_TYP, count(*) as TOTAL ' +
        '  FROM ssap_data_2 WHERE (';
    for (var i = 0; i < req.body.search.length; i++) {
        if (i > 0) sql += ' OR ';
        sql += ' SITE_GROUP_NME=\'' + req.body.search[i] + '\' ';
    }

    if (req.body.search.length === 0) {
        sql += ' 1 = 0 ';
    }

    sql += ')';

    //AND NOT HISTOLOGIC_ICDO3_TYP=\'\'';

    if (req.body.filters && req.body.filters.ICD_O3_CDE && req.body.filters.ICD_O3_CDE.length > 0) {
        let ICD_O3_CDE_filters = req.body.filters.ICD_O3_CDE;
        sql += ' AND (';
        for (var j = 0; j < ICD_O3_CDE_filters.length; j++) {
            if (j > 0) sql += ' OR ';
            sql += ' ICD_O3_CDE=\'' + ICD_O3_CDE_filters[j] + '\'';
        }
        sql += ') ';
    }

    if (req.body.filters && req.body.filters.HISTOLOGIC_ICDO3_TYP && req.body.filters.HISTOLOGIC_ICDO3_TYP.length > 0) {
        let ICD_O3_CDE_filters = req.body.filters.HISTOLOGIC_ICDO3_TYP;
        sql += ' AND (';
        for (var j = 0; j < ICD_O3_CDE_filters.length; j++) {
            if (j > 0) sql += ' OR ';
            sql += ' HISTOLOGIC_ICDO3_TYP=\'' + ICD_O3_CDE_filters[j] + '\'';
        }
        sql += ') ';
    }

    sql += ' GROUP BY SITE_GROUP_NME, SEER_ID, ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP ';

    if (req.body.sorter && req.body.sorter.order) {
        if (req.body.sorter.order === 'ascend') {
            sql += " ORDER BY TOTAL ASC, SEER_ID, ICD_O3_CDE "
        } else if (req.body.sorter.order === 'descend') {
            sql += " ORDER BY TOTAL DESC, SEER_ID, ICD_O3_CDE "
        }
    } else {
        sql += " ORDER BY SEER_ID, ICD_O3_CDE "
    }

    console.log(sql);

    sequelize.query(
        sql,
        {
            replacements: {search: req.body.search},
            type: sequelize.QueryTypes.SELECT
        })
        .then(result => {
            if (result.length > 0) {
                let total = 0;
                for (var i = 0; i < result.length; i++) {
                    //result[i].key = i;
                    total += result[i].TOTAL;
                }
                result.push({
                    SITE_GROUP_NME: 'Total Number of Cancer Records',
                    TOTAL: total
                })
            }
            res.json(result);
        });
});


app.post('/api/cancer_endpoint', (req, res) => {

    let sql =
        'SELECT SITE_GROUP_NME AS SITE_GROUP_NME, SEER_ID AS SEER_ID, ICD_O3_CDE AS ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP AS HISTOLOGIC_ICDO3_TYP, count(*) as TOTAL ' +
        '  FROM ssap_data_2 ' +
        ' WHERE SITE_GROUP_NME=(:search) '; //AND NOT HISTOLOGIC_ICDO3_TYP=\'\'';

    if (req.body.filters && req.body.filters.ICD_O3_CDE && req.body.filters.ICD_O3_CDE.length > 0) {
        let ICD_O3_CDE_filters = req.body.filters.ICD_O3_CDE;
        sql += ' AND (';
        for (var j = 0; j < ICD_O3_CDE_filters.length; j++) {
            if (j > 0) sql += ' OR ';
            sql += ' ICD_O3_CDE=\'' + ICD_O3_CDE_filters[j] + '\'';
        }
        sql += ') ';
    }

    if (req.body.filters && req.body.filters.HISTOLOGIC_ICDO3_TYP && req.body.filters.HISTOLOGIC_ICDO3_TYP.length > 0) {
        let ICD_O3_CDE_filters = req.body.filters.HISTOLOGIC_ICDO3_TYP;
        sql += ' AND (';
        for (var j = 0; j < ICD_O3_CDE_filters.length; j++) {
            if (j > 0) sql += ' OR ';
            sql += ' HISTOLOGIC_ICDO3_TYP=\'' + ICD_O3_CDE_filters[j] + '\'';
        }
        sql += ') ';
    }

    sql += ' GROUP BY SITE_GROUP_NME, SEER_ID, ICD_O3_CDE, HISTOLOGIC_ICDO3_TYP ';

    if (req.body.sorter && req.body.sorter.order) {
        if (req.body.sorter.order === 'ascend') {
            sql += " ORDER BY TOTAL ASC, SITE_GROUP_NME, SEER_ID, ICD_O3_CDE "
        } else if (req.body.sorter.order === 'descend') {
            sql += " ORDER BY TOTAL DESC, SITE_GROUP_NME, SEER_ID, ICD_O3_CDE "
        }
    } else {
        sql += " ORDER BY SITE_GROUP_NME, SEER_ID, ICD_O3_CDE "
    }

    sequelize.query(
        sql,
        {
            replacements: {search: req.body.search},
            type: sequelize.QueryTypes.SELECT
        })
        .then(result => {
            if (result.length > 0) {
                let total = 0;
                for (var i = 0; i < result.length; i++) {
                    //result[i].key = i;
                    total += result[i].TOTAL;
                }
                result.push({
                    SITE_GROUP_NME: 'Total Number of Cancer Records',
                    TOTAL: total
                })
            }
            res.json(result);
        });
});

app.post('/api/questionnarie', (req, res) => {

    let sql =
        "SELECT Questionnarie, Section, `Variable name`, Description, `Values` from questionnarie_metadata_2 WHERE 1 = 1";

    //`Pre-selected variables`=1 ";

    //console.log(JSON.stringify(req.body.search));

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        sql += " AND (";
        for (var i = 0; i < req.body.search.questionnarie.length; i++) {
            if (i > 0) sql += "  OR ";
            sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
        }
        sql += ")";

        if (req.body.search.searchTerm) {
            sql += ` AND ( Section LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            for (var i = 0; i < data.length; i++) {
                dataset.push({
                    questionnarie: data[i]['Questionnarie'],
                    section: data[i]['Section'],
                    variable: data[i]['Variable name'],
                    description: data[i]['Description'],
                    values: data[i]['Values']
                });
            }
            res.json(dataset);
        });
});

app.post('/api/questionnarie2', (req, res) => {

    let sql =
        "SELECT Questionnarie, Section, `Variable name`, Description, `Values` " +
        "  FROM questionnarie_metadata_2 WHERE NOT Section = '' ";

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        sql += " AND (";
        for (var i = 0; i < req.body.search.questionnarie.length; i++) {
            if (i > 0) sql += "  OR ";
            sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
        }
        sql += ")";

        if (req.body.search.searchTerm) {
            sql += ` AND ( Section LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            let current_section = null;
            for (var i = 0; i < data.length; i++) {

                if (data[i]['Section'] !== current_section) {
                    dataset.push({
                        questionnarie: data[i]['Questionnarie'],
                        section: data[i]['Section'],
                        variable: data[i]['Section'],
                        description: data[i]['Section'],
                    });

                    current_section = data[i]['Section'];
                }

                if (req.body.search.expends && req.body.search.expends[data[i]['Section']] === true) {
                    dataset.push({
                        questionnarie: data[i]['Questionnarie'],
                        section: data[i]['Section'],
                        variable: data[i]['Variable name'],
                        description: data[i]['Description'],
                        values: data[i]['Values']
                    });
                }
            }
            res.json(dataset);
        });
});

app.post('/api/topic', (req, res) => {

    let sql =
        "SELECT Questionnarie, topic_name, `Variable`, Description, `Values` " +
        "  FROM topic_2 WHERE NOT topic_name = '' ";

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        if (req.body.search.questionnarie.length !== 8) {
            sql += " AND (";
            for (var i = 0; i < req.body.search.questionnarie.length; i++) {
                if (i > 0) sql += "  OR ";
                sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
            }
            sql += ")";
        }

        if (req.body.search.searchTerm) {
            sql += ` AND ( topic_name LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    sql += " ORDER BY topic_name, Questionnarie ";

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            let current_section = null;
            for (var i = 0; i < data.length; i++) {
                if (data[i]['topic_name'] !== current_section) {
                    dataset.push({
                        questionnarie: data[i]['questionnarie'],
                        section: data[i]['topic_name'],
                        variable: data[i]['topic_name'],
                        description: data[i]['topic_name'],
                    });
                    current_section = data[i]['topic_name'];
                }

                if (req.body.search.expends && req.body.search.expends[data[i]['topic_name']] === true) {
                    dataset.push({
                        questionnarie: data[i]['questionnarie'],
                        section: data[i]['topic_name'],
                        variable: data[i]['Variable'],
                        description: data[i]['Description'],
                        values: data[i]['Values']
                    });
                }
            }

            res.json(dataset);
        });
});

app.post('/api/topic_variable', (req, res) => {

    let sql =
        "SELECT Questionnarie, topic_name, `Variable` " +
        "  FROM topic_2 WHERE NOT topic_name = '' ";

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        sql += " AND (";
        for (var i = 0; i < req.body.search.questionnarie.length; i++) {
            if (i > 0) sql += "  OR ";
            sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
        }
        sql += ")";

        if (req.body.search.searchTerm) {
            sql += ` AND ( topic_name LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    sql += " ORDER BY topic_name ";

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            let current_section = null;
            for (var i = 0; i < data.length; i++) {
                dataset.push({
                    questionnarie: data[i]['questionnarie'],
                    section: data[i]['topic_name'],
                    variable: data[i]['Variable'],
                });
            }
            res.json(dataset);
        });
});


app.post('/api/topic_for_original_design', (req, res) => {

    let sql =
        "SELECT Questionnarie, topic_name, `Variable`, Description, `Values`, section " +
        "  FROM topic_2 WHERE NOT topic_name = '' ";

    if (req.body.search.questionnarie && req.body.search.questionnarie.length > 0) {
        if (req.body.search.questionnarie.length !== 8) {
            sql += " AND (";
            for (var i = 0; i < req.body.search.questionnarie.length; i++) {
                if (i > 0) sql += "  OR ";
                sql += "Questionnarie='" + req.body.search.questionnarie[i] + "'";
            }
            sql += ")";
        }

        if (req.body.search.searchTerm) {
            sql += ` AND ( topic_name LIKE '%${req.body.search.searchTerm}%' OR  description LIKE '%${req.body.search.searchTerm}%' ) `
        }

        if (req.body.search.topics && req.body.search.topics.length > 0) {
            sql += ' AND (';
            for (var i = 0; i < req.body.search.topics.length; i++) {
                if (i > 0) sql += "  OR ";
                sql += ` topic_name ='${req.body.search.topics[i]}' `;
            }
            sql += " ) ";
        } else if (!req.body.search.searchTerm) {
            sql += " AND 1 = 0 ";
        }
    } else {
        sql += " AND 1 = 0 ";
    }

    sql += " ORDER BY topic_name, Questionnarie ";

    console.log("sql = " + sql);

    sequelize.query(sql)
        .then(result => {
            let data = result[0];
            let dataset = [];
            for (var i = 0; i < data.length; i++) {
                dataset.push({
                    questionnarie: data[i]['questionnarie'],
                    topic: data[i]['topic_name'],
                    variable: data[i]['Variable'],
                    description: data[i]['Description'],
                    values: data[i]['Values'],
                    section: data[i]['section']
                });
            }

            res.json(dataset);
        });
});

const Database = require('better-sqlite3');
const {Parser} = require('json2csv');

/*
let sql2 = "SELECT topic_name, questionnarie, variable as variable FROM topic_2 ";
const db2 = new Database('cts.sqlite', {verbose: console.log});
const stmt2 = db2.prepare(sql2);
const rows2 = stmt2.all();
let topic_to_variable = {};
for (var i = 0; i < rows2.length; i++) {
    console.log("======> " + rows2[i].topic_name+"  "+rows2[i].questionnarie + "   " + rows2[i].variable);
    console.log("        " + JSON.stringify(rows2[i]));

    if (topic_to_variable[rows2[i].topic_name] === undefined) {
        topic_to_variable[rows2[i].topic_name] = [];
    }

    topic_to_variable[rows2[i].topic_name].push({
        "variable": rows2[i].variable, "questionnarie": rows2[i].questionnarie
    })
}

console.log("================================");
console.log(JSON.stringify(topic_to_variable));
console.log("================================");
*/

let get_all_columns = () => {
    let sql = "PRAGMA table_info(ssap_data_2)";
    const db = new Database('cts.sqlite', {verbose: console.log});
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    let all_columns = [];
    for (var i = 0; i < rows.length; i++) {
        all_columns.push(rows[i].name);
    }
    return all_columns;
}

let get_questionnarie_columns = () => {
    let sql = "select `Variable Name` as variable from questionnarie_metadata_2";
    const db = new Database('cts.sqlite', {verbose: console.log});
    const stmt = db.prepare(sql);
    const rows = stmt.all();

    let all_columns = [];
    for (var i = 0; i < rows.length; i++) {
        all_columns.push(rows[i].variable);
    }
    return all_columns;
}

let all_columns = get_all_columns();
console.log("-------------- all columns --------------");
console.log(JSON.stringify(all_columns));

let questionnarie_columns = get_questionnarie_columns();
console.log("-------------- questionnarie columns --------------");
console.log(JSON.stringify(questionnarie_columns));

let meta_columns_2 = all_columns.filter(x => !questionnarie_columns.includes(x));
console.log("-------------- meta columns --------------");
console.log(JSON.stringify(meta_columns_2));


app.get('/api/download/data/:id/:abbrev', (req, res) => {
    const id = req.params.id;
    const abbrev = req.params.abbrev;

    Project.findOne({
        where: {id: id},
    }).then(project => {

        if (project.cancer_endpoint) {
            project.cancer_endpoint = JSON.parse(project.cancer_endpoint);
        }

        if (project.start_of_follow_up) {
            project.start_of_follow_up = JSON.parse(project.start_of_follow_up);
        }

        if (project.censoring_rules) {
            project.censoring_rules = JSON.parse(project.censoring_rules);
        }

        if (project.questionnarie) {
            project.questionnarie = JSON.parse(project.questionnarie);
        }

        //console.log("\n=========== download =============");
        //console.log(JSON.stringify(project));

        //console.log("\n=========== project questionnarie =============");
        //console.log(JSON.stringify(project.questionnarie));

        //const db = new Database('cts.sqlite', {verbose: console.log});

        var sqlite3 = require('sqlite3').verbose();
        var file = "cts.sqlite";
        var db = new sqlite3.Database(file);
        db.serialize(function() {

            let table_name = `ssap_data_${id}_${abbrev}`;

            let sql = `PRAGMA temp_store = 2`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // create a temporary table
            sql = `CREATE TEMP TABLE ${table_name} AS SELECT * FROM ssap_data_2`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // create an index for the temporary table
            sql = `CREATE INDEX ${table_name}_idx ON ${table_name}(ssap_id)`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // check
            sql = `SELECT count(*) FROM ${table_name}`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} size: ` + JSON.stringify(row));
                })
            });

            // delete the rows with breast_cancer_res_only_ind = 1 when 26000 is not in the selection
            let seer_ids = [];
            for (var j = 0; j < project.cancer_endpoint.length; j++) {
                let item = project.cancer_endpoint[j];
                seer_ids.push(item.SEER_ID);
            }

            sql = `DELETE FROM ${table_name} WHERE breast_cancer_res_only_ind = 1`;
            if (!seer_ids.includes('26000')) {
                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);
            }

            // check
            sql = `SELECT count(*) FROM ${table_name}`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} size after deleting breast_cancer_res_only_ind = 1 : ` + JSON.stringify(row));
                })
            });

            // If a user selects Questionnaire 2-Questionnaire 6 as the start date,
            // remove all rows where their selected date is null.
            if (project.start_of_follow_up.start_of_follow_up.startsWith("QNR_") &&
                !project.start_of_follow_up.start_of_follow_up.startsWith("QNR_1")) {
                sql = `
                    DELETE FROM ${table_name}
                     WHERE ${project.start_of_follow_up.start_of_follow_up} is NULL
                        OR ${project.start_of_follow_up.start_of_follow_up}=''
                `;
                console.log("---------------------------------------------------");
                console.log(sql);
                db.run(sql);

                // check
                sql = `SELECT count(*) FROM ${table_name}`;
                console.log("---------------------------------------------------");
                console.log(sql);
                db.all(sql, function(err, rows) {
                    rows.forEach(function (row) {
                        console.log(`table ${table_name} size after delete NULL start of follow up` + JSON.stringify(row));
                    })
                });
            }

            // Add a new column to the analytic data called analysis_start_date
            sql = `ALTER TABLE ${table_name} ADD COLUMN analysis_start_date TEXT`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // populate analysis_start_date with the user's selection
            if (project.start_of_follow_up.start_of_follow_up.startsWith("QNR_")) {
                sql = `UPDATE ${table_name} SET analysis_start_date=${project.start_of_follow_up.start_of_follow_up}`
                console.log("---------------------------------------------------");
                console.log(sql);
                db.run(sql);
            } else if (project.start_of_follow_up.start_of_follow_up.startsWith("Other") &&
                project.start_of_follow_up.start_of_follow_up_specified) {
                let other_date = project.start_of_follow_up.start_of_follow_up_specified.split('T')[0];
                sql = `UPDATE ${table_name} SET analysis_start_date='${other_date}'`;
                console.log("---------------------------------------------------");
                console.log(sql);
                db.run(sql);
            }

            // Add a new column to the analytic data called end_of_followup_date.
            sql = `ALTER TABLE ${table_name} ADD COLUMN end_of_followup_date TEXT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            if (project.censoring_rules.through_2015_12_31) {
                // If the user answers "Yes" to the first question of censering rule,
                // populate it with the user's selection (the admin_censoring_date -- currently 12/31/2017).
                let end_date = "2017-12-31";
                sql = `UPDATE ${table_name} SET end_of_followup_date='${end_date}'`;
                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);
            } else if (project.censoring_rules.end_of_follow_up.startsWith("QNR_")) {
                // If the user answer "No" to the first question of censering rule and selects another date,
                // populate end_of_followup_date with their selected date.
                sql = `UPDATE ${table_name} SET end_of_followup_date=${project.censoring_rules.end_of_follow_up}`;
                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);
            } else if (project.censoring_rules.end_of_follow_up.startsWith("Other") &&
                project.censoring_rules.end_of_follow_up_specified) {
                // If the user answer "No" to the first question of censering rule and selects another date,
                // populate end_of_followup_date with their selected date.
                let other_date = project.censoring_rules.end_of_follow_up_specified.split('T')[0];
                sql = `UPDATE ${table_name} SET end_of_followup_date='${other_date}'`;
                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);
            }

            // create a new column, case_indicator
            sql = `ALTER TABLE ${table_name} ADD COLUMN case_indicator INT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // marks rows that meet the user's endpoint definition and date_dt > analysis_start_date
            // with a 1 and all other rows with a 0.
            sql = `
                UPDATE ${table_name}
                   SET case_indicator=1
                 WHERE date_dt > analysis_start_date
                   AND ${getCoditionForCancerEndpoint(project.cancer_endpoint)}
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql = `UPDATE ${table_name} SET case_indicator=0 WHERE case_indicator is NULL`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // check
            sql = `SELECT count(*) FROM ${table_name} WHERE case_indicator=1`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} size for case_indicator=1: ` + JSON.stringify(row));
                })
            });

            // check
            sql = `SELECT count(*) FROM ${table_name} WHERE case_indicator=0`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} size for case_indicator=0: ` + JSON.stringify(row));
                })
            });

            // add a new column prevalent
            sql = `ALTER TABLE ${table_name} ADD COLUMN prevalent INT`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            if (project.start_of_follow_up.start_of_follow_up_exclude) {
                if (project.start_of_follow_up.start_of_follow_up_exclude === 'exclude all') {

                    // If DATE_DT is not NULL and DATE_DT < analysis_start_date
                    // OR brca_selfsurvey='Y' or endoca_self_q1='A' or cervca_self_q1='A'
                    // or ovryca_self_q1='A' or lungca_self_q1='A' or leuk_self_q1='A'
                    // or hodg_self_q1='A' or colnca_self_q1='A' or thyrca_self_q1='A'
                    // or meln_self_q1='A', then prevalent=1

                    sql =
                        `UPDATE ${table_name} SET prevalent=1
                          WHERE (NOT DATE_DT is NULL and DATE_DT < analysis_start_date)
                             OR brca_selfsurvey='Y'
                             OR endoca_self_q1='A'
                             OR cervca_self_q1='A'
                             OR ovryca_self_q1='A'
                             OR lungca_self_q1='A'
                             OR leuk_self_q1='A'
                             OR hodg_self_q1='A'
                             OR colnca_self_q1='A'
                             OR thyrca_self_q1='A'
                             OR meln_self_q1='A'
                        `;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.run(sql);

                    // Remove ALL ROWS for participants that have even just one row where prevalent=1
                    sql = `DELETE FROM ${table_name} WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)`;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.run(sql);

                } else if (project.start_of_follow_up.start_of_follow_up_exclude === 'exclude interest') {

                    let cmd =
                        `UPDATE ${table_name} SET prevalent=1
                        WHERE ${getCoditionForCancerEndpoint(project.cancer_endpoint)}
                          AND (NOT DATE_DT is NULL and DATE_DT < analysis_start_date`;

                    var found = false;
                    if (seer_ids.includes('26000')) {
                        // User selection includes SEER_ID=26000:
                        // If row meets the user's endpoint definition
                        // and DATE_DT is not NULL and DATE_DT < analysis_start_date
                        // OR brca_selfsurvey='Y'
                        // then prevalent=1
                        cmd += ` OR brca_selfsurvey='Y' `;
                        found = true;
                    }

                    if (seer_ids.includes('27020') || seer_ids.includes('27030')) {
                        cmd += " OR endoca_self_q1='A' ";
                        found = true;
                    }

                    if (seer_ids.includes('27010')) {
                        cmd += " OR cervca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('27040')) {
                        cmd += " OR ovryca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('27030')) {
                        cmd += " OR lungca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('35011') ||
                        seer_ids.includes('35012') ||
                        seer_ids.includes('35013') ||
                        seer_ids.includes('35014') ||
                        seer_ids.includes('35015') ||
                        seer_ids.includes('35016') ||
                        seer_ids.includes('35017') ||
                        seer_ids.includes('35018') ||
                        seer_ids.includes('35019') ||
                        seer_ids.includes('35020') ||

                        seer_ids.includes('35021') ||
                        seer_ids.includes('35022') ||
                        seer_ids.includes('35023') ||
                        seer_ids.includes('35024') ||
                        seer_ids.includes('35025') ||
                        seer_ids.includes('35026') ||
                        seer_ids.includes('35027') ||
                        seer_ids.includes('35028') ||
                        seer_ids.includes('35029') ||
                        seer_ids.includes('35030') ||

                        seer_ids.includes('35031') ||
                        seer_ids.includes('35032') ||
                        seer_ids.includes('35033') ||
                        seer_ids.includes('35034') ||
                        seer_ids.includes('35035') ||
                        seer_ids.includes('35036') ||
                        seer_ids.includes('35037') ||
                        seer_ids.includes('35038') ||
                        seer_ids.includes('35039') ||
                        seer_ids.includes('35040') ||

                        seer_ids.includes('35041') ||
                        seer_ids.includes('35042') ||
                        seer_ids.includes('35043')) {
                        cmd += " OR leuk_self_q1='A' ";
                        found = true;
                    }

                    if (seer_ids.includes('33011') || seer_ids.includes('33012')) {
                        cmd += " OR hodg_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('21041') ||
                        seer_ids.includes('21042') ||
                        seer_ids.includes('21043') ||
                        seer_ids.includes('21044') ||
                        seer_ids.includes('21045') ||
                        seer_ids.includes('21046') ||
                        seer_ids.includes('21047') ||
                        seer_ids.includes('21048') ||
                        seer_ids.includes('21049') ||
                        seer_ids.includes('21050') ||
                        seer_ids.includes('21051') ||
                        seer_ids.includes('21052') ||
                        seer_ids.includes('21053') ||
                        seer_ids.includes('21054') ||
                        seer_ids.includes('21055') ||
                        seer_ids.includes('21056') ||
                        seer_ids.includes('21057') ||
                        seer_ids.includes('21058') ||
                        seer_ids.includes('21059') ||
                        seer_ids.includes('21060')) {
                        cmd += " OR colnca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('32010')) {
                        cmd += " OR thyrca_self_q1 = 'A' ";
                        found = true;
                    }

                    if (seer_ids.includes('25010')) {
                        cmd += " OR meln_self_q1 = 'A' ";
                        found = true;
                    }

                    if (!found) {
                        // If user's selected cancer does NOT include SEER_ID in
                        // (26000, 27020, 27030, 27010, 27040, 22030, 35011-35043, 21041-21060, 32010, 25010),
                        // use this:
                        // If row meets user's selected cancer criteria
                        // and DATE_DT is not NULL and DATE_DT < analysis_start_date
                        // then prevalent=1
                    }

                    cmd += `)`;
                    sql = cmd;

                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.run(sql);

                    // check
                    sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name}`;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.all(sql, function(err, rows) {
                        rows.forEach(function (row) {
                            console.log(`how many panticipant: ` + JSON.stringify(row));
                        })
                    });

                    // check
                    sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name} WHERE prevalent=1 `;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.all(sql, function(err, rows) {
                        rows.forEach(function (row) {
                            console.log(`row count with prevalent=1: ` + JSON.stringify(row));
                        })
                    });

                    // Remove ALL ROWS for participants that have even just one row where prevalent=1
                    sql = `DELETE FROM ${table_name} WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)`;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.run(sql);

                    // check
                    sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name}`;
                    console.log("---------------------------------------------------");
                    console.log(sql);
                    db.all(sql, function(err, rows) {
                        rows.forEach(function (row) {
                            console.log(`how many panticipant after delete prevalent=1: ` + JSON.stringify(row));
                        })
                    });

                } else if (project.start_of_follow_up.start_of_follow_up_exclude === 'include all') {

                    // If DATE_DT is not NULL and DATE_DT < analysis_start_date
                    // OR brca_selfsurvey='Y'
                    // or endoca_self_q1='A'
                    // or cervca_self_q1='A'
                    // or ovryca_self_q1='A'
                    // or lungca_self_q1='A'
                    // or leuk_self_q1='A'
                    // or hodg_self_q1='A'
                    // or colnca_self_q1='A'
                    // or thyrca_self_q1='A'
                    // or meln_self_q1='A',
                    // then prevalent=1;
                    // else prevalent=0;

                    sql =
                        `UPDATE ${table_name} SET prevalent=1
                           WHERE (NOT DATE_DT is NULL and DATE_DT < analysis_start_date)
                              OR brca_selfsurvey='Y'
                              OR endoca_self_q1='A'
                              OR cervca_self_q1='A'
                              OR ovryca_self_q1='A'
                              OR lungca_self_q1='A'
                              OR leuk_self_q1='A'
                              OR hodg_self_q1='A'
                              OR colnca_self_q1='A'
                              OR thyrca_self_q1='A'
                              OR meln_self_q1='A'
                        `;
                    console.log("---------------------------------------------------")
                    console.log(sql);
                    db.run(sql);

                    // Assign ALL ROWS for participants that have even just one row meeting these conditions as prevalent=1.
                    sql =
                        `UPDATE ${table_name}
                            SET prevalent=1
                          WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)
                        `;
                    console.log("---------------------------------------------------")
                    console.log(sql);
                    db.run(sql);

                    sql = `UPDATE ${table_name} SET prevalent=0 WHERE prevalent is NULL`;
                    console.log("---------------------------------------------------")
                    console.log(sql);
                    db.run(sql);
                }
            }

            // Create a new date column called "firstselectedcancer_date."
            sql = `ALTER TABLE ${table_name} ADD COLUMN firstselectedcancer_date TEXT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            let min_dt_table_name = `${table_name}_min_dt`;
            sql = `
                CREATE TEMP TABLE ${min_dt_table_name} AS
                SELECT ssap_id, min(date_dt) as min_date_dt
                  FROM ${table_name}
                 WHERE case_indicator=1 AND NOT date_dt is NULL
                 GROUP BY ssap_id
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            //check
            sql = `SELECT count(*) FROM ${min_dt_table_name} `;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${min_dt_table_name}: ` + JSON.stringify(row));
                })
            });

            // Within rows where case_indicator=1,
            // take the DATE_DT from the first row for each participant and put it in firstselectedcancer_date.
            // All rows for a participant should have the SAME firstselectedcancer_date
            // this date should be pulled down for all rows for a participant. See image in next cell.
            // Participants who have no rows where case_indicator=1 will have a null value for this column.

            sql = `
                UPDATE ${table_name}
                   SET firstselectedcancer_date = (
                        SELECT min_date_dt
                          FROM ${min_dt_table_name}
                         WHERE ${table_name}.ssap_id = ssap_id
                       )
                  WHERE case_indicator=1
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // Create a new date column called "firstothercancer_date."
            sql = `ALTER TABLE ${table_name} ADD COLUMN firstothercancer_date TEXT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // Within rows where case_indicator=0 AND DATE_DT is NOT null
            // AND  date_dt > analysis_start_date,
            // take the DATE_DT from the first row for each participant and put it in the firstothercancer_date.

            let min_dt_other_table_name = `${table_name}_min_dt_other`;
            sql = `
                CREATE TEMP TABLE ${min_dt_other_table_name} AS
                SELECT ssap_id, min(date_dt) as min_date_dt
                  FROM ${table_name}
                 WHERE case_indicator=0 
                   AND NOT date_dt is NULL
                   AND date_dt > analysis_start_date
                 GROUP BY ssap_id
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // create an index for the table min_dt_other_table_name
            sql = `CREATE INDEX ${min_dt_other_table_name}_idx ON ${min_dt_other_table_name}(ssap_id)`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            //check
            sql = `SELECT count(*) FROM ${min_dt_other_table_name} `;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${min_dt_other_table_name}: ` + JSON.stringify(row));
                })
            });

            // All rows for a participant should have the SAME firstothercancer_date.
            // this date should be pulled down for all rows for a participant. See image in above cell.
            //
            // Participants who have no rows where case_indicator=0 and DATE_DT is not null
            // will have a null value for this column.

            sql = `
                UPDATE ${table_name}
                   SET firstothercancer_date = (
                        SELECT min_date_dt
                          FROM ${min_dt_other_table_name}
                         WHERE ${table_name}.ssap_id = ssap_id
                       )
                  WHERE case_indicator=0
                    AND NOT date_dt is NULL
                    AND date_dt > analysis_start_date
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);


            // Create a new date column called analysis_end_date.
            sql = `ALTER TABLE ${table_name} ADD COLUMN analysis_end_date TEXT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            var found = false;
            if (seer_ids.includes('27020') || seer_ids.includes('27030')) {
                // If user's selections include SEER_ID=27020 or 27030:
                // analysis_end_date=min(DATE_OF_DEATH_DT, first_moveout_ca_dt,
                // firstothercancer_date, firstselectedcancer_date, end_of_followup_date, HYSTERECTOMY_DT)

                if (project.censoring_rules && project.censoring_rules.end_of_follow_up_exclude === 'default') {

                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,    
                                   CASE 
                                      WHEN firstothercancer_date = '' OR firstothercancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstothercancer_date
                                   END,     
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN HYSTERECTOMY_DT = '' OR HYSTERECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE HYSTERECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstothercancer_date is NULL AND NOT firstothercancer_date = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT HYSTERECTOMY_DT is NULL AND NOT HYSTERECTOMY_DT = '')            
                    `;

                } else {

                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,       
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN HYSTERECTOMY_DT = '' OR HYSTERECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE HYSTERECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT HYSTERECTOMY_DT is NULL AND NOT HYSTERECTOMY_DT = '')            
                    `;
                }

                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);

                found = true;
            }

            if (seer_ids.includes('27040')) {
                // If user's selections include SEER_ID=27040:
                // analysis_end_date=min(DATE_OF_DEATH_DT,  first_moveout_ca_dt, firstothercancer_date,
                // firstselectedcancer_date, end_of_followup_date, BILATERAL_OOPHORECTOMY_DT)

                if (project.censoring_rules && project.censoring_rules.end_of_follow_up_exclude === 'default') {
                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,    
                                   CASE 
                                      WHEN firstothercancer_date = '' OR firstothercancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstothercancer_date
                                   END,     
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN BILATERAL_OOPHORECTOMY_DT = '' OR BILATERAL_OOPHORECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE BILATERAL_OOPHORECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstothercancer_date is NULL AND NOT firstothercancer_date = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT BILATERAL_OOPHORECTOMY_DT is NULL AND NOT BILATERAL_OOPHORECTOMY_DT = '')        
                    `;
                } else {
                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,         
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN BILATERAL_OOPHORECTOMY_DT = '' OR BILATERAL_OOPHORECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE BILATERAL_OOPHORECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT BILATERAL_OOPHORECTOMY_DT is NULL AND NOT BILATERAL_OOPHORECTOMY_DT = '')        
                    `;
                }

                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);

                found = true;
            }

            if (seer_ids.includes('26000')) {

                // If user's selections include SEER_ID=26000:
                // analysis_end_date=min(DATE_OF_DEATH_DT,  first_moveout_ca_dt,
                // firstothercancer_date, firstselectedcancer_date, end_of_followup_date,
                // BILATERAL_MASTECTOMY_DT)

                if (project.censoring_rules && project.censoring_rules.end_of_follow_up_exclude === 'default') {

                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,    
                                   CASE 
                                      WHEN firstothercancer_date = '' OR firstothercancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstothercancer_date
                                   END,     
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN BILATERAL_MASTECTOMY_DT = '' OR BILATERAL_MASTECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE BILATERAL_MASTECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstothercancer_date is NULL AND NOT firstothercancer_date = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT BILATERAL_MASTECTOMY_DT is NULL AND NOT BILATERAL_MASTECTOMY_DT = '')        
                    `;

                } else {

                    // If "DO NOT CENSOR AT OTHER CANCER DIAGNOSIS" was selected in the censoring rules module,
                    // "firstothercancer_date" will not be needed here either.

                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,        
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END,
                                   CASE 
                                      WHEN BILATERAL_MASTECTOMY_DT = '' OR BILATERAL_MASTECTOMY_DT IS NULL THEN '2999-12-31' 
                                      ELSE BILATERAL_MASTECTOMY_DT
                                   END
                                   )
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')  
                         OR (NOT BILATERAL_MASTECTOMY_DT is NULL AND NOT BILATERAL_MASTECTOMY_DT = '')        
                    `;
                }

                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);

                found = true;
            }

            if (!found) {

                // If user's selections do not include SEER_ID in (27020, 27030, 27040 or 26000), use this:
                // analysis_end_date=min(DATE_OF_DEATH_DT, first_moveout_ca_dt, firstothercancer_date,
                // firstselectedcancer_date, end_of_followup_date)

                if (project.censoring_rules && project.censoring_rules.end_of_follow_up_exclude === 'default') {
                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,    
                                   CASE 
                                      WHEN firstothercancer_date = '' OR firstothercancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstothercancer_date
                                   END,     
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END)
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstothercancer_date is NULL AND NOT firstothercancer_date = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')          
                    `;
                } else {
                    sql =
                        `UPDATE ${table_name}
                        SET analysis_end_date = 
                               min(CASE 
                                      WHEN DATE_OF_DEATH_DT = '' OR DATE_OF_DEATH_DT IS NULL THEN '2999-12-31' 
                                      ELSE DATE_OF_DEATH_DT 
                                   END, 
                                   CASE 
                                      WHEN first_moveout_ca_dt = '' OR first_moveout_ca_dt IS NULL THEN '2999-12-31' 
                                      ELSE first_moveout_ca_dt 
                                   END,        
                                   CASE 
                                      WHEN firstselectedcancer_date = '' OR firstselectedcancer_date IS NULL THEN '2999-12-31' 
                                      ELSE firstselectedcancer_date
                                   END, 
                                   CASE 
                                      WHEN end_of_followup_date = '' OR end_of_followup_date IS NULL THEN '2999-12-31' 
                                      ELSE end_of_followup_date
                                   END)
                      WHERE (NOT DATE_OF_DEATH_DT is NULL AND NOT DATE_OF_DEATH_DT = '')
                         OR (NOT first_moveout_ca_dt is NULL AND NOT first_moveout_ca_dt = '')
                         OR (NOT firstselectedcancer_date is NULL AND NOT firstselectedcancer_date = '') 
                         OR (NOT end_of_followup_date is NULL AND NOT end_of_followup_date = '')          
                    `;
                }

                console.log("---------------------------------------------------")
                console.log(sql);
                db.run(sql);

            }

            // check
            sql = `SELECT count(*) FROM ${table_name} WHERE NOT analysis_end_date is NULL`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} NOT analysis_end_date is NULL: ` + JSON.stringify(row));
                })
            });

            // check
            sql = `SELECT count(*) FROM ${table_name} WHERE date_dt > analysis_end_date`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                rows.forEach(function (row) {
                    console.log(`table ${table_name} date_dt > analysis_end_date: ` + JSON.stringify(row));
                })
            });

            // Create the event variable
            sql = `ALTER TABLE ${table_name} ADD COLUMN event INT`;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // if analysis_end_date=end_of_followup_date then event=5
            // if analysis_end_date=DATE_OF_DEATH_DT then event=4
            // if analysis_end_date=first_moveout_ca_dt then event=3
            // if analysis_end_date=firstothercancer_date then event=2
            //
            // (add these 3 where applicable)
            // if analysis_end_date=HYSTERECTOMY_DT then event=6
            // if analysis_end_date=BILATERAL_MASTECTOMY_DT then event=7
            // if analysis_end_date=BILATERAL_OOPHORECTOMY_DT then event=8
            //
            //
            // if analysis_end_date=firstselectedcancer_date then event=1
            //
            // The order is significant because sometimes these events fall on the same day.
            // This is the prioritization order:
            // firstselectedcancer_date, (hysterectomy, bilateral mastectomy or oophorectomy dates if applicable),
            // firstothercancer_date,  first_moveout_ca_dt, date_of_death_dt, end_of_follow_up_date)

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=firstselectedcancer_date THEN 1 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT firstselectedcancer_date is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=HYSTERECTOMY_DT THEN 6 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT HYSTERECTOMY_DT is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=BILATERAL_MASTECTOMY_DT THEN 7 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT BILATERAL_MASTECTOMY_DT is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=BILATERAL_OOPHORECTOMY_DT THEN 8 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT BILATERAL_OOPHORECTOMY_DT is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=firstothercancer_date THEN 2 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT firstothercancer_date is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=first_moveout_ca_dt THEN 3 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT first_moveout_ca_dt is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=DATE_OF_DEATH_DT THEN 4 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT DATE_OF_DEATH_DT is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            sql =
                `UPDATE ${table_name} 
                    SET event = CASE WHEN analysis_end_date=end_of_followup_date THEN 5 ELSE NULL END
                  WHERE NOT analysis_end_date is NULL
                    AND NOT end_of_followup_date is NULL
                    AND event is NULL
                `;
            console.log("---------------------------------------------------")
            console.log(sql);
            db.run(sql);

            // Remove all rows where date_dt > analysis_end_date
            sql = `DELETE FROM ${table_name} WHERE date_dt > analysis_end_date`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.run(sql);

            // build columns
            let selected_columns = [];
            for (const [questionnarie, variables] of Object.entries(project.questionnarie)) {
                for (const [variable, value] of Object.entries(variables)) {
                    selected_columns.push(variable);
                }
            }

            //console.log("\n=========== selected_columns =============");
            //console.log(JSON.stringify(selected_columns));

            let no_need_columns = questionnarie_columns.filter(x => !selected_columns.includes(x));
            let final_columns = all_columns.filter(x => !no_need_columns.includes(x));
            final_columns = final_columns.filter(x => x !== 'breast_cancer_res_only_ind');

            console.log("\n=========== final columns =============");
            console.log(JSON.stringify(final_columns));

            // process columns
            let real_columns = "";
            for (var i = 0; i < final_columns.length; i++) {
                if (i > 0) {
                    real_columns += ", ";
                }
                real_columns += final_columns[i];
            }

            // add case_indicator
            real_columns += ", case_indicator";

            // add analysis_start_date
            real_columns += ", analysis_start_date";

            // add end_of_followup_date
            real_columns += ", end_of_followup_date";

            // add prevalent column
            if (project.start_of_follow_up.start_of_follow_up_exclude &&
                project.start_of_follow_up.start_of_follow_up_exclude === 'include all') {
                real_columns += ", prevalent ";
            }

            // add column firstselectedcancer_date
            real_columns += ", firstselectedcancer_date";

            // add column firstothercancer_date
            real_columns += ", firstothercancer_date";

            // add column analysis_end_date
            real_columns += ", analysis_end_date ";

            // add column event
            real_columns += ", event"

            console.log("\n=========== real_columns =============");
            console.log(real_columns);


            // download
            sql = `SELECT ${real_columns} FROM ${table_name}`;
            console.log("---------------------------------------------------");
            console.log(sql);
            db.all(sql, function(err, rows) {
                /*
                rows.forEach(function (row) {
                    console.log(`final table ${table_name} size` + JSON.stringify(row));
                })
                 */

                const json2csv = new Parser();
                const csv = json2csv.parse(rows);
                res.header('Content-Type', 'text/csv');
                res.attachment(abbrev + '_' + new Date().getTime() + '.csv');
                return res.send(csv);

            });
        });

        db.close();




        /*
        console.log("---------------------------------------------------")
        const stmt = db.prepare(sql);
        const rows = stmt.all();
        console.log("rows size = " + rows.length);
        console.log(JSON.stringify(rows, null, 2));
         */

        /*
        let table_name = `ssap_data_${id}_${abbrev}`;

        console.log("---------------------------------------------------")
        db.exec(`PRAGMA temp_store = 2`);

        // create a temporary table
        console.log("---------------------------------------------------")
        db.exec(`CREATE TEMP TABLE ${table_name} AS SELECT * FROM ssap_data_2`);

        // delete the rows with breast_cancer_res_only_ind = 1 when 26000 is not in the selection
        let seer_ids = [];
        for (var j = 0; j < project.cancer_endpoint.length; j++) {
            let item = project.cancer_endpoint[j];
            seer_ids.push(item.SEER_ID);
        }
        if (!seer_ids.includes('26000')) {
            console.log("---------------------------------------------------")
            db.exec(`DELETE FROM ${table_name} WHERE breast_cancer_res_only_ind = 1`);
        }

        // If a user selects Questionnaire 2-Questionnaire 6 as the start date,
        // remove all rows where their selected date is null.
        if (project.start_of_follow_up.start_of_follow_up.startsWith("QNR_") &&
            !project.start_of_follow_up.start_of_follow_up.startsWith("QNR_1")) {
            console.log("---------------------------------------------------")
            db.exec(`
                DELETE FROM ${table_name}
                 WHERE ${project.start_of_follow_up.start_of_follow_up} is NULL
                    OR ${project.start_of_follow_up.start_of_follow_up}=''
            `);
        }

        // Add a new column to the analytic data called analysis_start_date
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN analysis_start_date TEXT`);

        // populate analysis_start_date with the user's selection
        if (project.start_of_follow_up.start_of_follow_up.startsWith("QNR_")) {
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET analysis_start_date=${project.start_of_follow_up.start_of_follow_up}`);
        } else if (project.start_of_follow_up.start_of_follow_up.startsWith("Other") &&
            project.start_of_follow_up.start_of_follow_up_specified) {
            let other_date = project.start_of_follow_up.start_of_follow_up_specified.split('T')[0];
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET analysis_start_date='${other_date}'`);
        }

        // Add a new column to the analytic data called end_of_followup_date.
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN end_of_followup_date TEXT`);

        if (project.censoring_rules.through_2015_12_31) {
            // If the user answers "Yes" to the first question of censering rule,
            // populate it with the user's selection (the admin_censoring_date -- currently 12/31/2017).
            let end_date = "2017-12-31";
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET end_of_followup_date='${end_date}'`);
        } else if (project.censoring_rules.end_of_follow_up.startsWith("QNR_")) {
            // If the user answer "No" to the first question of censering rule and selects another date,
            // populate end_of_followup_date with their selected date.
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET end_of_followup_date=${project.censoring_rules.end_of_follow_up}`);
        } else if (project.censoring_rules.end_of_follow_up.startsWith("Other") &&
            project.censoring_rules.end_of_follow_up_specified) {
            // If the user answer "No" to the first question of censering rule and selects another date,
            // populate end_of_followup_date with their selected date.
            let other_date = project.censoring_rules.end_of_follow_up_specified.split('T')[0];
            console.log("---------------------------------------------------")
            db.exec(`UPDATE ${table_name} SET end_of_followup_date='${other_date}'`);
        }

        // create a new column, case_indicator
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN case_indicator INT`);

        // marks rows that meet the user's endpoint definition and date_dt > analysis_start_date with a 1 and all other rows with a 0.
        console.log("---------------------------------------------------")
        db.exec(`
           UPDATE ${table_name}
              SET case_indicator=1
            WHERE date_dt > analysis_start_date
              AND ${getCoditionForCancerEndpoint(project.cancer_endpoint)}
        `);

        console.log("---------------------------------------------------")
        db.exec(`UPDATE ${table_name} SET case_indicator=0 WHERE case_indicator is NULL`);

        // add a new column prevalent
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN prevalent INT`);

        if (project.start_of_follow_up.start_of_follow_up_exclude) {
            if (project.start_of_follow_up.start_of_follow_up_exclude === 'exclude all') {

                // If DATE_DT is not NULL and DATE_DT < analysis_start_date
                // OR brca_selfsurvey='Y' or endoca_self_q1='A' or cervca_self_q1='A'
                // or ovryca_self_q1='A' or lungca_self_q1='A' or leuk_self_q1='A'
                // or hodg_self_q1='A' or colnca_self_q1='A' or thyrca_self_q1='A'
                // or meln_self_q1='A', then prevalent=1

                db.exec(`UPDATE ${table_name} SET prevalent=1
                    WHERE (NOT DATE_DT is NULL and DATE_DT < analysis_start_date)
                       OR brca_selfsurvey='Y'
                       OR endoca_self_q1='A'
                       OR cervca_self_q1='A'
                       OR ovryca_self_q1='A'
                       OR lungca_self_q1='A'
                       OR leuk_self_q1='A'
                       OR hodg_self_q1='A'
                       OR colnca_self_q1='A'
                       OR thyrca_self_q1='A'
                       OR meln_self_q1='A'
                `);



            } else if (project.start_of_follow_up.start_of_follow_up_exclude === 'exclude interest') {

                let cmd =
                    `UPDATE ${table_name} SET prevalent=1
                        WHERE ${getCoditionForCancerEndpoint(project.cancer_endpoint)}
                          AND (NOT DATE_DT is NULL and DATE_DT < analysis_start_date`;

                var found = false;
                if (seer_ids.includes('26000')) {
                    // User selection includes SEER_ID=26000:
                    // If row meets the user's endpoint definition
                    // and DATE_DT is not NULL and DATE_DT < analysis_start_date
                    // OR brca_selfsurvey='Y'
                    // then prevalent=1
                    cmd += ` OR brca_selfsurvey='Y' `;
                    found = true;
                }

                if (seer_ids.includes('27020') || seer_ids.includes('27030')) {
                    cmd += " OR endoca_self_q1='A' ";
                    found = true;
                }

                if (seer_ids.includes('27010')) {
                    cmd += " OR cervca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('27040')) {
                    cmd += " OR ovryca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('27030')) {
                    cmd += " OR lungca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('35011') ||
                    seer_ids.includes('35012') ||
                    seer_ids.includes('35013') ||
                    seer_ids.includes('35014') ||
                    seer_ids.includes('35015') ||
                    seer_ids.includes('35016') ||
                    seer_ids.includes('35017') ||
                    seer_ids.includes('35018') ||
                    seer_ids.includes('35019') ||
                    seer_ids.includes('35020') ||

                    seer_ids.includes('35021') ||
                    seer_ids.includes('35022') ||
                    seer_ids.includes('35023') ||
                    seer_ids.includes('35024') ||
                    seer_ids.includes('35025') ||
                    seer_ids.includes('35026') ||
                    seer_ids.includes('35027') ||
                    seer_ids.includes('35028') ||
                    seer_ids.includes('35029') ||
                    seer_ids.includes('35030') ||

                    seer_ids.includes('35031') ||
                    seer_ids.includes('35032') ||
                    seer_ids.includes('35033') ||
                    seer_ids.includes('35034') ||
                    seer_ids.includes('35035') ||
                    seer_ids.includes('35036') ||
                    seer_ids.includes('35037') ||
                    seer_ids.includes('35038') ||
                    seer_ids.includes('35039') ||
                    seer_ids.includes('35040') ||

                    seer_ids.includes('35041') ||
                    seer_ids.includes('35042') ||
                    seer_ids.includes('35043')) {
                    cmd += " OR leuk_self_q1='A' ";
                    found = true;
                }

                if (seer_ids.includes('33011') || seer_ids.includes('33012')) {
                    cmd += " OR hodg_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('21041') ||
                    seer_ids.includes('21042') ||
                    seer_ids.includes('21043') ||
                    seer_ids.includes('21044') ||
                    seer_ids.includes('21045') ||
                    seer_ids.includes('21046') ||
                    seer_ids.includes('21047') ||
                    seer_ids.includes('21048') ||
                    seer_ids.includes('21049') ||
                    seer_ids.includes('21050') ||
                    seer_ids.includes('21051') ||
                    seer_ids.includes('21052') ||
                    seer_ids.includes('21053') ||
                    seer_ids.includes('21054') ||
                    seer_ids.includes('21055') ||
                    seer_ids.includes('21056') ||
                    seer_ids.includes('21057') ||
                    seer_ids.includes('21058') ||
                    seer_ids.includes('21059') ||
                    seer_ids.includes('21060')) {
                    cmd += " OR colnca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('32010')) {
                    cmd += " OR thyrca_self_q1 = 'A' ";
                    found = true;
                }

                if (seer_ids.includes('25010')) {
                    cmd += " OR meln_self = 'A' ";
                    found = true;
                }

                if (!found) {
                    // If user's selected cancer does NOT include SEER_ID in
                    // (26000, 27020, 27030, 27010, 27040, 22030, 35011-35043, 21041-21060, 32010, 25010),
                    // use this:
                    // If row meets user's selected cancer criteria
                    // and DATE_DT is not NULL and DATE_DT < analysis_start_date
                    // then prevalent=1
                }

                cmd += `)`;
                db.exec(`${cmd}`);

                let sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name}`;
                let stmt = db.prepare(sql);
                let rows = stmt.all();
                console.log(JSON.stringify(rows, null, 2));

                sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name} WHERE prevalent=1 `;
                stmt = db.prepare(sql);
                rows = stmt.all();
                console.log(JSON.stringify(rows, null, 2));

                // Remove ALL ROWS for participants that have even just one row where prevalent=1
                db.exec(`DELETE FROM ${table_name} WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)`);

                sql = `SELECT count(DISTINCT ssap_id) FROM ${table_name}`;
                stmt = db.prepare(sql);
                rows = stmt.all();
                console.log(JSON.stringify(rows, null, 2));

            } else if (project.start_of_follow_up.start_of_follow_up_exclude === 'include all') {

                // If DATE_DT is not NULL and DATE_DT < analysis_start_date
                // OR brca_selfsurvey='Y'
                // or endoca_self_q1='A'
                // or cervca_self_q1='A'
                // or ovryca_self_q1='A'
                // or lungca_self_q1='A'
                // or leuk_self_q1='A'
                // or hodg_self_q1='A'
                // or colnca_self_q1='A'
                // or thyrca_self_q1='A'
                // or meln_self_q1='A',
                // then prevalent=1;
                // else prevalent=0;

                db.exec(`UPDATE ${table_name} SET prevalent=1
                    WHERE (NOT DATE_DT is NULL and DATE_DT < analysis_start_date)
                       OR brca_selfsurvey='Y'
                       OR endoca_self_q1='A'
                       OR cervca_self_q1='A'
                       OR ovryca_self_q1='A'
                       OR lungca_self_q1='A'
                       OR leuk_self_q1='A'
                       OR hodg_self_q1='A'
                       OR colnca_self_q1='A'
                       OR thyrca_self_q1='A'
                       OR meln_self_q1='A'
                `);

                // Assign ALL ROWS for participants that have even just one row meeting these conditions as prevalent=1.
                db.exec(
                    `UPDATE ${table_name}
                        SET prevalent=1
                      WHERE ssap_id IN (SELECT DISTINCT ssap_id FROM ${table_name} WHERE prevalent=1)
                `);

                console.log("---------------------------------------------------")
                db.exec(`UPDATE ${table_name} SET prevalent=0 WHERE prevalent is NULL`);

            }
        }

        // Create a new date column called "firstselectedcancer_date."
        console.log("---------------------------------------------------")
        db.exec(`ALTER TABLE ${table_name} ADD COLUMN firstselectedcancer_date TEXT`);

        let min_dt_table_name = `${table_name}_min_dt`
        db.exec(
            `CREATE TEMP TABLE ${min_dt_table_name} AS
                SELECT ssap_id, min(date_dt) as min_date_dt
                  FROM ${table_name}
                 WHERE case_indicator=1 AND NOT date_dt is NULL
                 GROUP BY ssap_id
        `);

        let sql1 = `SELECT count(*) FROM ${min_dt_table_name} `;
        let stmt1 = db.prepare(sql1);
        let rows1 = stmt1.all();
        console.log(JSON.stringify(rows1, null, 2));

        // Within rows where case_indicator=1,
        // take the DATE_DT from the first row for each participant and put it in firstselectedcancer_date.
        // All rows for a participant should have the SAME firstselectedcancer_date
        // this date should be pulled down for all rows for a participant. See image in next cell.
        // Participants who have no rows where case_indicator=1 will have a null value for this column.

        db.exec(
            `UPDATE ${table_name}
                SET firstselectedcancer_date = (
                        SELECT min_date_dt
                          FROM ${min_dt_table_name}
                         WHERE ${table_name}.ssap_id = ssap_id
                    )
              WHERE case_indicator=1
        `);

        sql1 = `
           SELECT ssap_id,
                  seer_id, icd_o3_cde,
                  histologic_icdo3_typ,
                  QNR_2_FILL_DT,
                  date_dt,
                  case_indicator,
                  firstselectedcancer_date
             FROM ${table_name}
            WHERE ssap_id = 90558938
            ORDER BY ssap_id
            LIMIT 100
         `;
        stmt1 = db.prepare(sql1);
        rows1 = stmt1.all();
        console.log(JSON.stringify(rows1, null, 2));
         */


        // query the table to get data
        /*
        let table_name = 'ssap_data_2';
        sql = `SELECT count(DISTINCT ssap_id) as total FROM ${table_name}`;
        console.log("---------------------------------------------------")
        const stmt = db.prepare(sql);
        const rows = stmt.all();
        console.log("rows size = " + rows.length);
        console.log(JSON.stringify(rows, null, 2));
         */

        /*
        let new_rows = [];
        for (var i = 0; i < rows.length; i++) {
            let row = rows[i];
            let new_row = {...row};
            for (const [key, value] of Object.entries(row)) {
                //console.log(`${key}: ${value}`);
                if (value === '' || value === 'undefined' || value === 'Undefined') {
                    new_row[key] = undefined;
                } else {
                    let tmp = Number(value);
                    if (!isNaN(tmp)) {
                        new_row[key] = tmp;
                    }
                }
            }
            new_rows.push(new_row);
        }
         */

        // drop the table
        // console.log("---------------------------------------------------")
        //db.exec(`DROP TABLE ${table_name}`);

        /*
        const json2csv = new Parser();
        const csv = json2csv.parse(new_rows);
        res.header('Content-Type', 'text/csv');
        res.attachment(abbrev + '_' + new Date().getTime() + '.csv');
        return res.send(csv);
         */

    });

    /*
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', 'attachment; filename=' + abbrev + '_' + new Date().getTime() + '.csv');
    res.send(rows);
     */

    /*
    sequelize.query(sql)
        .then(result => {
            res.set('Content-Type', 'application/octet-stream');
            res.set('Content-Disposition', 'attachment; filename=' + abbrev + '_' + new Date().getTime() + '.csv');
            res.send(result[0]);
        });
    */

});

app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);

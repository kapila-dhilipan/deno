const fast_connection = require("../connections/fastconnection");

class BooleanSearch {
  static async advanceBoolean({ search, booleansearch, starvalues, itSkills, unavi, current_Location }) {

    const searchQuery = search.join(" ");
    const starDust = search.filter((item) => !starvalues.includes(item));
    const blueGaint = [];
    if (starDust.length > 0) {
      blueGaint.push(...starDust);
    } else {
      blueGaint.push(" ");
    }

    function isEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(searchQuery);
    }
    if (!searchQuery) {
      return "Query Parameter is Missing";
    }
    const modifiedResults = [];
    const excludedWord = [];
    const orBooleanWords = [];
    const andBooleanWords = [];
    const commonBooleanword = []


    search.forEach((query) => {
      const regex = /not\s+(\S+)/gi;
      const orRegex = /(\S+)\s+or\s+(\S+)/gi;
      const andRegex = /(\S+)\s+and\s+(\S+)/gi;

      let modifiedArray = query.split(/\s+(?:(?:AND|not|or|in)\s+)/gi);
      commonBooleanword.push(modifiedArray);

      const notMatches = query.match(regex);
      if (notMatches) {
        const notWords = notMatches.map(match => match.replace(/not\s+/i, ""));
        excludedWord.push(notWords);
        modifiedArray = modifiedArray.filter(item => !notWords.includes(item));
      }

      const orMatches = [...query.matchAll(orRegex)];
      orMatches.forEach(match => {
        const orWords = [match[1], match[2]];
        orBooleanWords.push(orWords);
        modifiedArray = modifiedArray.filter(item => !orWords.includes(item));
      });

      const andMatches = [...query.matchAll(andRegex)];
      andMatches.forEach(match => {
        const andWords = [match[1], match[2]];
        andBooleanWords.push(andWords);
      });

      modifiedResults.push(modifiedArray);
    });
    const email_agregate = [
      {
        $search: {
          index: "ats_boolean",
          text: {
            query: searchQuery,
            path: "email",
            fuzzy: {
              maxEdits: 2,
            },
          },
          highlight: {
            path: "email",
          },
        },
      },
      {
        $match: {
          email: searchQuery,
        },
      },
      { $limit: 15 },
    ];
    const must_aggregate = [
      {
        $search: {
          index: "ats_boolean",
          compound: {
            must: {
              text: {
                query: commonBooleanword.flat(),
                path: [
                  "first_name",
                  "last_name",
                  "state",
                  "city",
                  "skillset.skill",
                  "prefered_location",
                  "email",
                  "employment_details.job_role",
                  "employment_details.job_skills",
                ],
              },
            },
          }
        },
      }
    ];


    const mustnot_aggregate = [
      {
        $search: {
          index: "ats_boolean",
          compound: {
            must: {
              text: {
                query: commonBooleanword.flat(),
                path: [
                  "first_name",
                  "last_name",
                  "state",
                  "city",
                  "skillset.skill",
                  "prefered_location",
                  "email",
                  "employment_details.job_role",
                  "employment_details.job_skills",
                ],
              },
            },
            mustNot: {
              text: {
                query: unavi.length !== 0 ? unavi.flat() : excludedWord.flat(),
                path: { wildcard: "*" },
              },
            },
          },
        },
      },
    ];

    const comman_aggregate = [
      {
        $search: {
          index: "ats_boolean",
          compound: {
            must: {
              text: {
                query: search,
                path: [
                  "first_name",
                  "last_name",
                  "state",
                  "city",
                  "skillset.skill",
                  "prefered_location",
                  "email",
                  "employment_details.job_role",
                  "employment_details.job_skills",
                ],
              },
            },
          },
        },
      },
      { $limit: 15 },
    ];
    const star_aggregate = [
      {
        $search: {
          index: "ats_boolean",
          compound: {
            must: [
              {
                text: {
                  query: commonBooleanword.flat(),
                  path: [
                    "first_name",
                    "last_name",
                    "state",
                    "city",
                    "skillset.skill",
                    "prefered_location",
                    "email",
                    "employment_details.job_role",
                    "employment_details.job_skills",
                  ],
                },
              },
            ],
            should: [
              {
                text: {
                  query: blueGaint,
                  path: [
                    "first_name",
                    "last_name",
                    "state",
                    "city",
                    "skillset.skill",
                    "prefered_location",
                    "email",
                    "employment_details.job_role",
                    "employment_details.job_skills",
                  ],
                },
              },
            ],
          },
        },
      },
    ]
    function checkSkills(obj, values) {
      return values.every(value =>
        Object.values(obj).some(fieldValue => {
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(value);
          } else if (typeof fieldValue === 'string') {
            return fieldValue.includes(value);
          }
          return false;
        })
      );
    }

    async function candidateLoc(currentLocation, mustHaveData) {
      if (currentLocation.length > 0) {
        try {
          const r = await fast_connection.models.candidate.find({
            "current_location": { $in: currentLocation }
          });
          if (!commonBooleanword.includes(currentLocation)) {
            commonBooleanword.push(currentLocation)
          }
          mustHaveData.push(r);
        } catch (error) {
          console.error("Error fetching data:", error);
          // Handle the error here if needed
        }
      }
    }

    const dataStream = (results) => {
      const data = results.flat().map((e) => {
        return {
          "id": e._id.toString(),
          "skills": Array.isArray(e.skillset) ? e.skillset.map(skill => skill.skill ? skill.skill.toLowerCase() : null) : null,
          "first_name": typeof e.first_name === 'string' ? e.first_name.toLowerCase() : null,
          "last_name": typeof e.last_name === 'string' ? e.last_name.toLowerCase() : null,
          "state": typeof e.state === 'string' ? e.state.toLowerCase() : null,
          "city": typeof e.city === 'string' ? e.city.toLowerCase() : null,
          "prefered_location": typeof e.prefered_location === 'string' ? e.prefered_location.toLowerCase() : null,
          "email": typeof e.email === 'string' ? e.email.toLowerCase() : null,
          "employment_details": Array.isArray(e.employment_details) ? e.employment_details.map(detail => typeof detail.job_role === 'string' ? detail.job_role.toLowerCase() : null) : null,
          "employment_skills": Array.isArray(e.employment_details) ? e.employment_details.map(detail => detail.job_skills ? detail.job_skills.toLowerCase() : null) : null,
          "current_location": typeof e.current_location === 'string' ? e.current_location.toLowerCase() : null,
        }
      });
      return data
    }
    if (booleansearch === true) {
      if (isEmail()) {
        try {
          const result = await fast_connection.models.candidate.aggregate(
            email_agregate
          );
          return result;
        } catch (err) {
          throw err;
        }
      } else {
        try {
          if (excludedWord == "") {
            const mustHaveData = [];
            const coSt = [];
            itSkills.forEach(async (itSkill) => {
              if (itSkill?.mustHave === true) {
                const skillRegex = new RegExp(itSkill.skill, 'i');
                const r = await fast_connection.models.candidate.find({
                  "skillset": {
                    $elemMatch: {
                      "skill": { $regex: skillRegex },
                      "exp": itSkill.experience
                    }
                  }
                });
                if (!coSt.includes(itSkill.skill)) {
                  coSt.push(itSkill.skill);
                }

                if (!coSt.includes(andBooleanWords.flat())) {
                  coSt.push(andBooleanWords.flat());
                }
                mustHaveData.push(r);
              }
            });
            candidateLoc(current_Location, mustHaveData)
            const result = await fast_connection.models.candidate.aggregate(must_aggregate);
            mustHaveData.push(result)
            const incursionWord = (coSt.flat().length > 0) ? coSt.flat().map((e) => e.toLowerCase()) : andBooleanWords.flat().map((e) => e.toLowerCase());
            // const NewResult = dataStream(result).filter(obj => checkSkills(obj, incursionWord));
            const mustHaveDetails = dataStream(mustHaveData).filter(obj => checkSkills(obj, incursionWord));
            const mustHaveIDs = mustHaveDetails.map((e) => e.id)
            // const listIds = NewResult.map((e) => e.id)
            // if (itSkills.map((e) => e.mustHave) === true) {
            //   const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
            //   return newOne.slice(0, 15);
            // } else {
            //   const newOne = await fast_connection.models.candidate.find({ "_id": listIds })
            //   return newOne.slice(0, 15);
            // }
            const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
            return newOne.slice(0, 15);
          } else if (excludedWord.length > 0) {
            const mustHaveData = [];
            const coSt = [];
            itSkills.forEach(async (itSkill) => {
              if (itSkill?.mustHave === true) {
                const skillRegex = new RegExp(itSkill.skill, 'i');
                const r = await fast_connection.models.candidate.find({
                  "skillset": {
                    $elemMatch: {
                      "skill": { $regex: skillRegex },
                      "exp": itSkill.experience
                    }
                  }
                });
                if (!coSt.includes(itSkill.skill)) {
                  coSt.push(itSkill.skill);
                }

                if (!coSt.includes(andBooleanWords.flat())) {
                  coSt.push(andBooleanWords.flat());
                }
                mustHaveData.push(r);
              }
            });
            candidateLoc(current_Location, mustHaveData)
            const result = await fast_connection.models.candidate.aggregate(
              mustnot_aggregate
            );
            mustHaveData.push(result)
            const incursionWord = (coSt.flat().length > 0) ? coSt.flat().map((e) => e.toLowerCase()) : andBooleanWords.flat().map((e) => e.toLowerCase());
            //const NewResult = dataStream(result).filter(obj => checkSkills(obj, incursionWord));
            const mustHaveDetails = dataStream(mustHaveData).filter(obj => checkSkills(obj, incursionWord));
            const mustHaveIDs = mustHaveDetails.map((e) => e.id)
            // const listIds = NewResult.map((e) => e.id)
            // if (itSkills.map((e) => e.mustHave) === true) {
            //   const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
            //   return newOne.slice(0, 15);
            // } else {
            //   const newOne = await fast_connection.models.candidate.find({ "_id": listIds })
            //   return newOne.slice(0, 15);
            // }
            const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
            return newOne.slice(0, 15);
          }
        } catch (err) {
          console.error("Error executing search:", err);
          throw err;
        }
      }
    } else {
      if (isEmail()) {
        try {
          const result = await fast_connection.models.candidate.aggregate(
            email_agregate
          );
          return result;
        } catch (err) {
          throw err;
        }
      } else {
        if (Array.isArray(starvalues) && starvalues.length > 0 && starvalues[0] !== "" && unavi.length == 0) {
          const mustHaveData = [];
          const coSt = [];
          console.log("A1")
          itSkills.forEach(async (itSkill) => {
            if (itSkill?.mustHave === true) {
              const skillRegex = new RegExp(itSkill.skill, 'i');
              const r = await fast_connection.models.candidate.find({
                "skillset": {
                  $elemMatch: {
                    "skill": { $regex: skillRegex },
                    "exp": itSkill.experience
                  }
                }
              });
              if (!coSt.includes(itSkill.skill)) {
                coSt.push(itSkill.skill);
              }

              if (!coSt.includes(andBooleanWords.flat())) {
                coSt.push(andBooleanWords.flat());
              }

              mustHaveData.push(r);
            }
          });

          candidateLoc(current_Location, mustHaveData, coSt);
          const result = await fast_connection.models.candidate.aggregate(
            star_aggregate
          );
          mustHaveData.push(result)
          const incursionWord = (coSt.flat().length > 0) ? coSt.flat().map((e) => e.toLowerCase()) : starvalues.map((e) => e.toLowerCase());
          // const NewResult = dataStream(result).filter(obj => checkSkills(obj, incursionWord));
          const mustHaveDetails = dataStream(mustHaveData).filter(obj => checkSkills(obj, incursionWord));
          const mustHaveIDs = mustHaveDetails.map((e) => e.id)
          // const listIds = NewResult.map((e) => e.id)
          // if ((itSkills.map((e) => e.mustHave) === true) | (mustHaveIDs.length >0)) {
          // const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
          // return newOne.slice(0, 15);
          // } else {
          //   const newOne = await fast_connection.models.candidate.find({ "_id": listIds })
          //   return newOne.slice(0, 15);
          // }
          const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
          return newOne.slice(0, 15);
        } else if ((starvalues.length !== 0) && (unavi.length !== 0)) {
          const mustHaveData = [];
          const coSt = [];
          console.log("A2")
          itSkills.forEach(async (itSkill) => {
            if (itSkill?.mustHave === true) {
              const skillRegex = new RegExp(itSkill.skill, 'i');
              const r = await fast_connection.models.candidate.find({
                "skillset": {
                  $elemMatch: {
                    "skill": { $regex: skillRegex },
                    "exp": itSkill.experience
                  }
                }
              });
              if (!coSt.includes(itSkill.skill)) {
                coSt.push(itSkill.skill);
              }

              if (!coSt.includes(andBooleanWords.flat())) {
                coSt.push(andBooleanWords.flat());
              }
              mustHaveData.push(r);
            }
          });
          const result = await fast_connection.models.candidate.aggregate(
            star_aggregate
          ) && await fast_connection.models.candidate.aggregate(mustnot_aggregate);
          const incursionWord = (coSt.flat().length > 0) ? coSt.flat().map((e) => e.toLowerCase()) : starvalues.flat().map((e) => e.toLowerCase());
          //const NewResult = dataStream(result).filter(obj => checkSkills(obj, incursionWord));
          mustHaveData.push(result)
          const mustHaveDetails = dataStream(mustHaveData).filter(obj => checkSkills(obj, incursionWord));
          const mustHaveIDs = mustHaveDetails.map((e) => e.id)
          // const listIds = NewResult.map((e) => e.id)
          // if (itSkills.map((e) => e.mustHave) === true) {
          //   const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
          //   return newOne.slice(0, 15);
          // } else {
          //   const newOne = await fast_connection.models.candidate.find({ "_id": listIds })
          //   return newOne.slice(0, 15);
          // }
          const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
          return newOne.slice(0, 15);
        } else if (starvalues.length === 0 && unavi.length > 0) {
          console.log("A3")
          const result = await fast_connection.models.candidate.aggregate(mustnot_aggregate);
          return result.slice(0, 15);
        } else {
          const result = await fast_connection.models.candidate.aggregate(
            comman_aggregate
          );
          console.log("A4")
          return result.slice(0, 15);
        }
      }
    }
  }

  static async BooleanascCandidate({ skip, limit, search, booleansearch, starvalues, itSkills, unavi, current_Location }) {
    const searchQuery = search.join(" ");
    const starDust = search.filter((item) => !starvalues.includes(item));
    const blueGaint = [];
    if (starDust.length > 0) {
      blueGaint.push(...starDust);
    } else {
      blueGaint.push(" ");
    } const skipValue = parseInt(skip);
    const limitValue = parseInt(limit);
    function isEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(searchQuery);
    }
    if (!searchQuery) {
      return "query parameter is missing";
    }
    const modifiedResults = [];
    const excludedWord = [];
    const orBooleanWords = [];
    const andBooleanWords = [];
    const commonBooleanword = []

    search.forEach((query) => {
      const regex = /not\s+(\S+)/gi;
      const orRegex = /(\S+)\s+or\s+(\S+)/gi;
      const andRegex = /(\S+)\s+and\s+(\S+)/gi;

      let modifiedArray = query.split(/\s+(?:(?:AND|not|or|in)\s+)/gi);
      commonBooleanword.push(modifiedArray);

      const notMatches = query.match(regex);
      if (notMatches) {
        const notWords = notMatches.map(match => match.replace(/not\s+/i, ""));
        excludedWord.push(notWords);
        modifiedArray = modifiedArray.filter(item => !notWords.includes(item));
      }

      const orMatches = [...query.matchAll(orRegex)];
      orMatches.forEach(match => {
        const orWords = [match[1], match[2]];
        orBooleanWords.push(orWords);
        modifiedArray = modifiedArray.filter(item => !orWords.includes(item));
      });

      const andMatches = [...query.matchAll(andRegex)];
      andMatches.forEach(match => {
        const andWords = [match[1], match[2]];
        andBooleanWords.push(andWords);
      });

      modifiedResults.push(modifiedArray);
    });
    const email_agregate = [
      {
        $search: {
          index: "ats_boolean",
          text: {
            query: searchQuery,
            path: "email",
            fuzzy: {
              maxEdits: 2,
            },
          },
          highlight: {
            path: "email",
          },
        },
      },
      {
        $match: {
          email: searchQuery,
        },
      },
      { $skip: skipValue },
      { $limit: limitValue },
    ];
    const must_aggregate = [
      {
        $search: {
          index: "ats_boolean",
          compound: {
            must: {
              text: {
                query: commonBooleanword.flat(),
                path: [
                  "first_name",
                  "last_name",
                  "state",
                  "city",
                  "skillset.skill",
                  "prefered_location",
                  "email",
                  "employment_details.job_role",
                  "employment_details.job_skills",
                ],
              },
            },
          }
        },
      }
    ];
    const mustnot_aggregate = [
      {
        $search: {
          index: "ats_boolean",
          compound: {
            must: {
              text: {
                query: commonBooleanword.flat(),
                path: [
                  "first_name",
                  "last_name",
                  "state",
                  "city",
                  "skillset.skill",
                  "prefered_location",
                  "email",
                  "employment_details.job_role",
                  "employment_details.job_skills",
                ],
              },
            },
            mustNot: {
              text: {
                query: unavi !== "" ? unavi.flat() : excludedWord.flat(),
                path: { wildcard: "*" },
              },
            },
          },
        },
      },
    ];

    const comman_aggregate = [
      {
        $search: {
          index: "ats_boolean",
          compound: {
            must: {
              text: {
                query: search,
                path: [
                  "first_name",
                  "last_name",
                  "state",
                  "city",
                  "skillset.skill",
                  "prefered_location",
                  "email",
                  "employment_details.job_role",
                  "employment_details.job_skills",
                ],
              },
            },
          },
        },
      },
      { $skip: skipValue },
      { $limit: limitValue },
    ];

    const star_aggregate = [
      {
        $search: {
          index: "ats_boolean",
          compound: {
            must: [
              {
                text: {
                  query: commonBooleanword.flat(),
                  path: [
                    "first_name",
                    "last_name",
                    "state",
                    "city",
                    "skillset.skill",
                    "prefered_location",
                    "email",
                    "employment_details.job_role",
                    "employment_details.job_skills",
                  ],
                },
              },
            ],
            should: [
              {
                text: {
                  query: blueGaint,
                  path: [
                    "first_name",
                    "last_name",
                    "state",
                    "city",
                    "skillset.skill",
                    "prefered_location",
                    "email",
                    "employment_details.job_role",
                    "employment_details.job_skills",
                  ],
                },
              },
            ],
          },
        },
      },
    ]
    function checkSkills(obj, values) {
      return values.every(value =>
        Object.values(obj).some(fieldValue => {
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(value);
          } else if (typeof fieldValue === 'string') {
            return fieldValue.includes(value);
          }
          return false;
        })
      );
    }

    const dataStream = (results) => {
      const data = results.flat().map((e) => {
        return {
          "id": e._id.toString(),
          "skills": Array.isArray(e.skillset) ? e.skillset.map(skill => skill.skill ? skill.skill.toLowerCase() : null) : null,
          "first_name": typeof e.first_name === 'string' ? e.first_name.toLowerCase() : null,
          "last_name": typeof e.last_name === 'string' ? e.last_name.toLowerCase() : null,
          "state": typeof e.state === 'string' ? e.state.toLowerCase() : null,
          "city": typeof e.city === 'string' ? e.city.toLowerCase() : null,
          "prefered_location": typeof e.prefered_location === 'string' ? e.prefered_location.toLowerCase() : null,
          "email": typeof e.email === 'string' ? e.email.toLowerCase() : null,
          "employment_details": Array.isArray(e.employment_details) ? e.employment_details.map(detail => typeof detail.job_role === 'string' ? detail.job_role.toLowerCase() : null) : null,
          "employment_skills": Array.isArray(e.employment_details) ? e.employment_details.map(detail => detail.job_skills ? detail.job_skills.toLowerCase() : null) : null,
          "current_location": typeof e.current_location === 'string' ? e.current_location.toLowerCase() : null,
        }
      });
      return data
    }
    async function candidateLoc(currentLocation, mustHaveData) {
      if (currentLocation.length > 0) {
        try {
          const r = await fast_connection.models.candidate.find({
            "current_location": { $in: currentLocation }
          });
          if (!commonBooleanword.includes(currentLocation)) {
            commonBooleanword.push(currentLocation)
          }
          mustHaveData.push(r);
        } catch (error) {
          console.error("Error fetching data:", error);
          // Handle the error here if needed
        }
      }
    }
    if (booleansearch === true) {
      try {
        if (isEmail()) {
          try {
            const result = await fast_connection.models.candidate.aggregate(
              email_agregate
            );
            return result;
          } catch (err) {
            console.error("Error executing search:", err);
            throw err;
          }
        } else {
          try {
            if (excludedWord == "") {
              const mustHaveData = []
              const coSt = [];
              itSkills.forEach(async (itSkill) => {
                if (itSkill?.mustHave === true) {
                  const skillRegex = new RegExp(itSkill.skill, 'i');
                  const r = await fast_connection.models.candidate.find({
                    "skillset": {
                      $elemMatch: {
                        "skill": { $regex: skillRegex },
                        "exp": itSkill.experience
                      }
                    }
                  });
                  if (!coSt.includes(itSkill.skill)) {
                    coSt.push(itSkill.skill);
                  }

                  if (!coSt.includes(andBooleanWords.flat())) {
                    coSt.push(andBooleanWords.flat());
                  }
                  mustHaveData.push(r);
                }
              });
              candidateLoc(current_Location, mustHaveData)
              const result = await fast_connection.models.candidate.aggregate(must_aggregate);
              mustHaveData.push(result)
              const incursionWord = (coSt.flat().length > 0) ? coSt.flat().map((e) => e.toLowerCase()) : andBooleanWords.flat().map((e) => e.toLowerCase());
              //const NewResult = dataStream(result).filter(obj => checkSkills(obj, incursionWord));
              const mustHaveDetails = dataStream(mustHaveData).filter(obj => checkSkills(obj, incursionWord));
              const mustHaveIDs = mustHaveDetails.map((e) => e.id)
              // const listIds = NewResult.map((e) => e.id)
              // if (itSkills.map((e) => e.mustHave) === true) { 
              //   const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
              //   return newOne.slice(skipValue, limitValue + skipValue);
              // } else {
              //   const newOne = await fast_connection.models.candidate.find({ "_id": listIds })
              //   return newOne.slice(skipValue, limitValue + skipValue);
              // }
              const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
              return newOne.slice(skipValue, limitValue + skipValue);
            } else if (excludedWord.length > 0) {
              const mustHaveData = []
              const coSt = [];
              itSkills.forEach(async (itSkill) => {
                if (itSkill?.mustHave === true) {
                  const skillRegex = new RegExp(itSkill.skill, 'i');
                  const r = await fast_connection.models.candidate.find({
                    "skillset": {
                      $elemMatch: {
                        "skill": { $regex: skillRegex },
                        "exp": itSkill.experience
                      }
                    }
                  });
                  if (!coSt.includes(itSkill.skill)) {
                    coSt.push(itSkill.skill);
                  }

                  if (!coSt.includes(andBooleanWords.flat())) {
                    coSt.push(andBooleanWords.flat());
                  }
                  mustHaveData.push(r);
                }
              });
              const result = await fast_connection.models.candidate.aggregate(
                mustnot_aggregate
              );

              const incursionWord = (coSt.flat().length > 0) ? coSt.flat().map((e) => e.toLowerCase()) : andBooleanWords.flat().map((e) => e.toLowerCase());
              //const NewResult = dataStream(result).filter(obj => checkSkills(obj, incursionWord));
              mustHaveData.push(result)
              const mustHaveDetails = dataStream(mustHaveData).filter(obj => checkSkills(obj, incursionWord));
              const mustHaveIDs = mustHaveDetails.map((e) => e.id)
              //const listIds = NewResult.map((e) => e.id)
              // if (itSkills.map((e) => e.mustHave) === true) {
              //   const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
              //   return newOne.slice(skipValue, limitValue + skipValue);
              // } else {
              //   const newOne = await fast_connection.models.candidate.find({ "_id": listIds })
              //   return newOne.slice(skipValue, limitValue + skipValue);
              // }
              const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
              return newOne.slice(skipValue, limitValue + skipValue);
            }
          } catch (err) {
            console.error("Error executing search:", err);
            throw err;
          }
        }
      } catch (error) {
        throw error;
      }
    } else {
      try {
        if (isEmail()) {
          try {
            const result = await fast_connection.models.candidate.aggregate(
              email_agregate
            );
            return result;
          } catch (err) {
            console.error("Error executing search:", err);
            throw err;
          }
        } else {
          try {
            if (Array.isArray(starvalues) && starvalues.length > 0 && starvalues[0] !== "" && unavi.length == 0) {
              const mustHaveData = []
              const coSt = [];
              itSkills.forEach(async (itSkill) => {
                if (itSkill?.mustHave === true) {
                  const skillRegex = new RegExp(itSkill.skill, 'i');
                  const r = await fast_connection.models.candidate.find({
                    "skillset": {
                      $elemMatch: {
                        "skill": { $regex: skillRegex },
                        "exp": itSkill.experience
                      }
                    }
                  });
                  if (!coSt.includes(itSkill.skill)) {
                    coSt.push(itSkill.skill);
                  }

                  if (!coSt.includes(andBooleanWords.flat())) {
                    coSt.push(andBooleanWords.flat());
                  }
                  mustHaveData.push(r);
                }
              });
              candidateLoc(current_Location, mustHaveData)
              const result = await fast_connection.models.candidate.aggregate(
                star_aggregate
              );
              const incursionWord = (coSt.flat().length > 0) ? coSt.flat().map((e) => e.toLowerCase()) : starvalues.map((e) => e.toLowerCase());
              //const NewResult = dataStream(result).filter(obj => checkSkills(obj, incursionWord));
              mustHaveData.push(result)
              const mustHaveDetails = dataStream(mustHaveData).filter(obj => checkSkills(obj, incursionWord));
              const mustHaveIDs = mustHaveDetails.map((e) => e.id)
              // const listIds = NewResult.map((e) => e.id)
              // if (itSkills.map((e) => e.mustHave) === true) {
              //   const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
              //   return newOne.slice(skipValue, limitValue + skipValue);
              // } else {
              //   const newOne = await fast_connection.models.candidate.find({ "_id": listIds })
              //   return newOne.slice(skipValue, limitValue + skipValue);
              // }
              const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
              return newOne.slice(skipValue, limitValue + skipValue);
            } else if ((starvalues.length !== 0) && (unavi.length !== 0)) {
              const mustHaveData = [];
              const coSt = [];
              itSkills.forEach(async (itSkill) => {
                if (itSkill?.mustHave === true) {
                  const skillRegex = new RegExp(itSkill.skill, 'i');
                  const r = await fast_connection.models.candidate.find({
                    "skillset": {
                      $elemMatch: {
                        "skill": { $regex: skillRegex },
                        "exp": itSkill.experience
                      }
                    }
                  });
                  if (!coSt.includes(itSkill.skill)) {
                    coSt.push(itSkill.skill);
                  }

                  if (!coSt.includes(andBooleanWords.flat())) {
                    coSt.push(andBooleanWords.flat());
                  }
                  mustHaveData.push(r);
                }
              });
              candidateLoc(current_Location, mustHaveData)
              const result = await fast_connection.models.candidate.aggregate(
                star_aggregate
              ) && await fast_connection.models.candidate.aggregate(mustnot_aggregate);
              const incursionWord = (coSt.flat().length > 0) ? coSt.flat().map((e) => e.toLowerCase()) : starvalues.map((e) => e.toLowerCase());
              //const NewResult = dataStream(result).filter(obj => checkSkills(obj, incursionWord));
              mustHaveData.push(result)
              const mustHaveDetails = dataStream(mustHaveData).filter(obj => checkSkills(obj, incursionWord));
              const mustHaveIDs = mustHaveDetails.map((e) => e.id)
              // const listIds = NewResult.map((e) => e.id)
              // if (itSkills.map((e) => e.mustHave) === true) {
              //   const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
              //   return newOne.slice(skipValue, limitValue + skipValue);
              // } else {
              //   const newOne = await fast_connection.models.candidate.find({ "_id": listIds })
              //   return newOne.slice(skipValue, limitValue + skipValue);
              // }
              const newOne = await fast_connection.models.candidate.find({ "_id": mustHaveIDs })
              return newOne.slice(skipValue, limitValue + skipValue);
            } else if (starvalues.length === 0 && unavi.length > 0) {
              const result = await fast_connection.models.candidate.aggregate(mustnot_aggregate);
              return result.slice(skipValue, limitValue + skipValue);
            } else {
              const result = await fast_connection.models.candidate.aggregate(
                comman_aggregate
              );
              return result;
            }
          } catch (err) {
            console.error("Error executing search:", err);
            throw err;
          }
        }
      } catch (error) {
        throw error;
      }
    }
  }

  static async searchFeild(searchList) {
    try {
      const query = {};
      console.log(searchList, "ui")

      const allFields = searchList.allFields;
      console.log(allFields, "7")
      if (searchList.allFields.current_location && Array.isArray(searchList.allFields.current_location)) {
        const locationQuery = { $in: searchList.allFields.current_location };
        query.current_location = locationQuery;
      }



      // if (searchList.city) {
      //   query.city = allFields.city;
      // }

      // if (searchList?.skills && Array.isArray(searchList?.skills)) {
      //   const skillsQuery = [];

      //   for (const skill of searchList?.skills) {
      //     if (skill?.skill && skill?.minExp && skill?.minExp) {
      //       const skillRegex = new RegExp(skill?.skill, 'i');
      //       skillsQuery.push({
      //         skill: { $regex: skillRegex },
      //         exp: { $gte: skill?.minExp, $lte: skill?.minExp }
      //       });
      //     }
      //   }

      //   if (skillsQuery.length > 0) {
      //     query['skillset'] = { $elemMatch: { $or: skillsQuery } };
      //   }
      // }
      // if (typeof allFields.willing_to_relocate === 'boolean') {
      //   query.willing_to_relocate = allFields.willing_to_relocate;
      // }

      // if (allFields.prefered_location) {
      //   query.prefered_location = allFields.prefered_location;
      // }

      if (searchList.skills && Array.isArray(searchList.skills)) {
        const skillsQuery = [];

        for (const skill of searchList.skills) {
          if (skill.skill && skill.experience) {
            const skillRegex = new RegExp(skill.skill, 'i');
            console.log(typeof (skill.experience))
            const exp = (parseInt(skill.experience) * 12)
            console.log(exp)
            skillsQuery.push({
              skill: { $regex: skillRegex },
              exp: { $gte: exp }
            });
          }
        }

        if (skillsQuery.length > 0) {
          query['skillset'] = { $elemMatch: { $or: skillsQuery } };
        }
      }

      if (allFields?.expected_ctc) {
        query.expected_ctc = allFields.expected_ctc;
      }

      // if (allFields?.notice_period) {
      //   query.notice_period = allFields.notice_period;
      // }
      console.log(allFields.gender)
      if (allFields?.gender) {
        query.gender = allFields.gender;
      }

      // if (allFields.minSalary && allFields.maxSalary) {

      //   const minSalaryValue = parseFloat(allFields.minSalary.replace(/[^\d.]/g, ''));
      //   const maxSalaryValue = parseFloat(allFields.maxSalary.replace(/[^\d.]/g, ''));
      //   console.log(minSalaryValue, maxSalaryValue)

      //   if (!isNaN(minSalaryValue) && !isNaN(maxSalaryValue)) {
      //     console.log(query['expected_ctc'] = {
      //       $regex: new RegExp(`^${minSalaryValue}LPA$|^${maxSalaryValue}LPA$`),
      //       $gte: `${minSalaryValue}LPA`,
      //       $lte: `${maxSalaryValue}LPA`
      //     })
      //     query['expected_ctc'] = {
      //       $regex: new RegExp(`^${minSalaryValue}LPA$|^${maxSalaryValue}LPA$`),
      //       $gte: `${minSalaryValue}LPA`,
      //       $lte: `${maxSalaryValue}LPA`
      //     }
      //   }
      // }


      if (allFields?.work_model) {
        const work_modelRegex = new RegExp(allFields.work_model, 'i');
        query['employment_details.work_model'] = { $regex: work_modelRegex };
      }

      if (allFields?.job_role) {
        const jobRoleRegex = new RegExp(allFields.job_role, 'i');
        query['employment_details.job_role'] = { $regex: jobRoleRegex };
      }
      if (allFields?.designation) {
        const designationRegex = new RegExp(allFields.designation, 'i');
        query['employment_details.job_role'] = { $regex: designationRegex };
      }
      if (allFields?.industry_type) {
        const industryTypeRegex = new RegExp(allFields.industry_type, 'i');
        query['employment_details.industry_type'] = { $regex: industryTypeRegex };
      }
      if (allFields?.employment_type) {
        const employmentTypeRegex = new RegExp(allFields.employment_type, 'i');
        query['employment_details.employment_type'] = { $regex: employmentTypeRegex };
      }
      if (allFields?.company_name) {
        const companyNameRegex = new RegExp(allFields.company_name, 'i');
        query['employment_details.company_name'] = { $regex: companyNameRegex };
      }

      const result = await fast_connection.models.candidate.find(query);
      console.log(result)
      return result;
    } catch (error) {
      console.error('Error searching candidates:', error);
      throw error;
    }
  }

  static async resumeSearch(searchTerm) {
    try {
      // Search for candidates with matching resume_text or resume_url
      const results = await fast_connection.models.candidate.find({
        $or: [
          { resume_text: { $regex: searchTerm, $options: 'i' } },
          { resume_url: { $regex: searchTerm, $options: 'i' } }
        ]
      });

      // Loop through the results
      for (const candidate of results) {
        // Check if resume_data is empty
        if (!candidate.resume_data) {
          // Fetch the content from the resume_url and parse it as text
          const resumeContent = await fetchResumeContent(candidate.resume_url); // Implement fetchResumeContent function

          // Update the candidate's resume_data with the parsed content
          candidate.resume_data = resumeContent;

          // Save the updated candidate back to the database
          await candidate.save();
        }
      }

      // Return the results
      console.log(results.length);
      return results;
    } catch (error) {
      console.error(error);
      throw error;
    }
    // async function fetchResumeContent(resumeUrl) {
    //   try {
    //     // Fetch the resume content from the provided URL
    //     const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
    //     const resumeBuffer = response.data;

    //     // Parse the resume content (assuming it's in DOCX format)
    //     const result = await mammoth.extractRawText({ buffer: resumeBuffer });
    //     const resumeText = result.value;
    //     console.log(resumeText)
    //     return resumeText;

    //   } catch (error) {
    //     console.error('Error fetching or parsing the resume:', error);
    //     throw error;
    //   }
    // }
  }


}

module.exports = BooleanSearch;

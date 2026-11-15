'use strict';

/** Stitch/reference art from Downloads battle-pass mock. */
const IMG = {
  gold: 'https://lh3.googleusercontent.com/aida/ALJJyrBzKGfrxy3MeE8Tysv2k9UIjmwvchopvx_dsB2AzX3jERJrrAZb62TKgNP2jcVITaVgkT5xchuuDkDComGPvxbW06Ufcn_qh54E_gCGT_uFc7yYTq-DCq2EA9LDJkVzI08RcIZgEox9lVYbo490Y5GGZBbWaWhCft_Yik58FQEsEisiyd22zmu7Wao2OE1gNBshFHmEbME8QRgFmv7ODc1ssLqHHbCMrSdv4FApew',
  cream: 'https://lh3.googleusercontent.com/aida/ALJJyrAZq4_uD--uBjf8iN8NzcYZnsyF79M1TgiXNLiO86SQDLadkpqxRxJjm5JZ1mldhshBsIKUdE9oovp7lJyc4Pg5QK3kZgh4fJ_ZZNs5VhA98LNBN1_MM2X-eKWtE1iNnm8C4Rw4Q1bNu4_Kqf-PzXst4SicdHQF_bH6CfFiDZez8I9nrLZNR8nfXiHcQlargUjZK4Ol9gBuuBv7vZX6Wm7T88a0MawU6dJJglaN8ik',
  mint: 'https://lh3.googleusercontent.com/aida/ALJJyrBLpp7inLllz3Nr3qZvTPAkXH88pwHyxYcYBgsT9peq7gi9M1LS_RCycvjaf4Plr3zNGTjqXZJeq9w05lUbIO15PQ_UyBl_Mkd71lqmhHRlCDoU1W2j7yvPm8iTouBLZ99EatjLMdnmpQ_XtcQDEG7lgjw0beJvhvqWjibchUVFGv7Mo1b0OZLesqA7Erwq-Fw1f3bazlmhZmpQx8kyMv8MG52pB3dlcxx7cwSnLc4',
  scroll: 'https://lh3.googleusercontent.com/aida/ALJJyrAQvLuGl-OO4YemQRU3k-LMnJ27T3fXqq5LFVTNLzwFoFOjUeg2041orzzCLxcSTFGBIy40JKZHLz56-RExwFT_xn0yTqVzzW_ajf_4kFmEZmFR3wngBki0ED5_9ZW5fN-BqRwYIy4zXKLRYmDxro7-a_Ga0tbjJcMFrybZF22UiYmhtqg0hxkvsLrcQ3Vbb1iOPV0KRV-0M19rnojU4pOPfg-3e6kThB5a2_5CGiU',
  fish: 'https://lh3.googleusercontent.com/aida/ALJJyrDd-alPu6Tb0EeYVdzdkbEt1Vgy32MqhO6cDuUEn263F4tVgDqaG0wq-6fOKfUAYGecm3N3EuG1tq3wK3NEKQkwRg3Q1EqugvsaUq9SJ8DRek6wF6pSHH9QH_jYp6GtLUYaqxyZbEcH80_QUAtGgsTiqMW_vjBHpZeK94Z5has1te_7tMoJxL8BDvwhDdtV_A1_x2xyZVp-lroXt8jY2I56aZC4sWNAE3zDUoeH16s',
  amulet: 'https://lh3.googleusercontent.com/aida/ALJJyrA2pVs-ig7DWrpIa6KTGXpODCNKa61yiKlSb3izRIpP5inHkSx_CLfU8xczORD_uYZsvMZxE1gK9lo3E9q12rdJkf-GCYCRV5WXPENBS6ykQIPWOZSXASDSpsaJ6uh14nQaHf0qaa6t1Nh82GzgQRZ4iVakFwecS3xNUqN9xy7njGRco9aQTY18phVgmxGx3R17mUmXE6vSTzEtAwxIeGvvpu1QByD7Oi7rrjuXQTE',
  armor: 'https://lh3.googleusercontent.com/aida/ALJJyrDyntp6fpCuxUuGkC4N8FxaikY-Fcl0Ihri2_XEVKOGYVkOJ_lpIXy8_E56lDYrw8AsUeC73AANkavRaums3LapYt6ZuaGXxRs3dID5a4iJ3h4B6gdV6zh82kO3FZ5He6EyPuLOFIRDLXSZTBZxhANHz6LgGZeTJiu3gHrd5paCH-vkuneUlfK3owCyTWMw4CkmQQ9U_Y9bAj_K0SOBmpcPvXuf88iV2rJjpiLJhlE',
  feed: 'https://lh3.googleusercontent.com/aida/ALJJyrAvoom5Bv9aZ30hCf1TyzV4hiHmd-QtNFDzyCUMZYjIQCUTI4t_rKYoKoDVF2do_IPQHI1pjISQGXSis263o3pWWv-Blnqe7dCbJS9RfXfFwS0OcD3mEE8e5WgWNLw_PM5h15Iqbh9KUies5nDfPC4ZA3GltgxkTQoHfD6QJyNzv8glHq3Du5NfXhaYbb8cOc472GCHIq_AXo8Cu2eQ0GBCw9UadBRdFNj9hKm8MRo',
  ring: 'https://lh3.googleusercontent.com/aida/ALJJyrAwiaH2P3epOl1YnNvRbB7vzCPQirrsDhgCKuU3Nc-WQSYnJzG7I6QdXNnX9vcG6PfjviiyBkoiNUjvpTqbLKSAk6vh_fMgd_AEdz2pPwsQ4Pbd2sJWSy7LLThtc1MJtJXeYZ4pHqzqhL-Sux7BthQ-PCIQ9lW1o3BBHzVRlGqNxjTwYtXHMRSfD4DZhYiYAr2z40OIbvk9mA1GhvJOXrOI9tettdffKW4ckNozVts',
  tome: 'https://lh3.googleusercontent.com/aida/ALJJyrAZNB9IUzyCZPhm1DCuWctF1e0qNiRyBhc-rSUTEgD0aoIU2PmXlM3fcAZ_vhysExTd_k4zWQuVopaRSRjOtbbjjf-2B7RzQdYkv0F_080M0ssYejF85bScFnMrgGvt48-70Pwcz8gxcBvCR4rLfGKpJ3pT4G6z7Yw5IEibfD_UANEpFvrrG87Dlo3FC38LQngwskpzeGQs_mH1TpsCta6sER7B0SfjXDN-uRQxuZc',
  potions: 'https://lh3.googleusercontent.com/aida/ALJJyrDKh6hxE4igYU4Y8p00RLddO6wB12ADgM-UM0lsNt6KlPZDe-xH_H554FIzRm8-mTvA3ygl8FV349SigGlxIKoGxrW2iA_qkeMDS0dJzWfUXY3HWPm6Lf2w8vTdfp5BCjYDsFGePhPuX5YEjnRSIuDvNkd1lCTAJayVeWInlDSpAlWcg76rC-sHHerT_X7mkFu-GzCcH-pQYF1a64745RSlUGAA6UyW7a1Wkk-SUXY',
  skin: 'https://lh3.googleusercontent.com/aida/ALJJyrDAAqXuwLEqLWgGgitL8wqaWx7gNqbyiy_84gRIccMt2bsReZD5Xp7u0uVV3QfUfIBlDNcucjFI_KUi0qfzE5djofbjCp6EpOAH1Z121fiRQv5DEMm-eNd5cQnaXn65ALfR-BmGEIrSguaTPaqV5czCbDZS3Eu1b6U0FtZ5pFN0vUMu0cY95TyuDZ2VNc4V9_kn6wqXonTclGG4MUxr6YzGmPfjsEnk9hUkRE3VwOo',
  seeds: 'https://lh3.googleusercontent.com/aida/ALJJyrACnxzhCxSCVwh03zNTb1KjCIC4_IojLJskb3dO2eemrnJXL1dsfGgBuYCe_HPiRfXysiclVGdMVV6sHRTM2CmkxfeyrY9g6Or8bBZW7jvHAN6NkDBbZ1yEq9NO8KqIjhxwNeAWguBGi6iickh09DyheBq8knomO-8yw9H71zzBYdBfJ5xgv71u2FvZ0ql3V7U-JjVARuiJDLCGtHNMpqoZCLkNSy-nOaz2c-kJmcg',
};

function reward(id, name, claimed, extras = {}) {
  return { id, name, claimed, ...extras };
}

const db = {
  user: { id: 1, gold: 8950, energy: 84, maxEnergy: 100, fish: 1420, level: 28, xp: 2450, maxXp: 3000 },
  seasonPreview: [
    { name: 'Багровая Броня Дракона', desc: 'Мифик-сет элитного пасса (ур. 28)', image: IMG.armor, tag: 'МИФИК' },
    { name: 'Боевая Алхимия', desc: 'Эликсиры и сливки сезона', image: IMG.potions, tag: 'РЕАГЕНТЫ' },
    { name: 'Ресурсы для Фермы', desc: 'Семена, руда, древесина', image: IMG.seeds, tag: 'РЕСУРСЫ' },
  ],
  /** Levels 25–27 claimed; 28 claimable; 29–32 locked. */
  passLevels: [
    {
      level: 25,
      freeReward: reward('f25', '2,500 Золота', true, { gold: 2500, image: IMG.gold }),
      eliteReward: reward('e25', 'Сливки ×5', true, { energy: 5, image: IMG.cream }),
    },
    {
      level: 26,
      freeReward: reward('f26', 'Мята ×10', true, { image: IMG.mint }),
      eliteReward: reward('e26', 'Свиток Призыва', true, { image: IMG.scroll }),
    },
    {
      level: 27,
      freeReward: reward('f27', 'Рыбка ×150', true, { fish: 150, image: IMG.fish }),
      eliteReward: reward('e27', 'Астрал-Амулет', true, { image: IMG.amulet }),
    },
    {
      level: 28,
      freeReward: reward('f28', '5,000 Золота', false, { gold: 5000, image: IMG.gold }),
      eliteReward: reward('e28', 'Панцирь Дракона', false, { isMythic: true, image: IMG.armor }),
    },
    {
      level: 29,
      freeReward: reward('f29', 'Корм ×50', false, { image: IMG.feed }),
      eliteReward: reward('e29', 'Перстень Света', false, { image: IMG.ring }),
    },
    {
      level: 30,
      freeReward: reward('f30', 'Фолиант Опыта', false, { gold: 500, image: IMG.tome }),
      eliteReward: reward('e30', 'Набор Зелий', false, { energy: 10, image: IMG.potions }),
    },
    {
      level: 31,
      freeReward: reward('f31', 'Рыбка ×300', false, { fish: 300, image: IMG.fish }),
      eliteReward: reward('e31', 'Амулет Удачи', false, { image: IMG.amulet }),
    },
    {
      level: 32,
      freeReward: reward('f32', '10,000 Золота', false, { gold: 10000, image: IMG.gold }),
      eliteReward: reward('e32', '«Барс Солнца»', false, { isMythic: true, image: IMG.skin }),
    },
  ],
};

module.exports = { db };

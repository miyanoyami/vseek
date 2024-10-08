import { useState } from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { VT, VTS } from './types/Vt.ts'
import { question } from './types/question.ts'
import './App.css'
import 'bulma/css/bulma.css'
import VTCard from './components/VTCard.tsx'

function App() {
	const basePath = process.env.GITHUB_PAGES ? '/sonorv/dist/' : '/sonorv/'
	let vts = VTS

	function findName(input: string) {
		setNameFinding(input)
		const result: VT[] = vts.filter((vt) => vt.name.includes(input))
		setNameFound(result.length > 0)
	}

	function createScoreMatch(choisesCount: number) {
		return (attrs: number[], input: number): number => {
			// 末尾の選択肢（こだわらない）のときは全員最高評価
			if (choisesCount === input) {
				return 0
			}

			if (attrs.includes(input)) {
				return 0
			} else {
				return -1000
			}
		}
	}

	function createScoreNorm(choisesCount: number) {
		return (attrs: number[], input: number): number => {
			// 末尾の選択肢（こだわらない）のときは全員最高評価
			if (choisesCount === input) {
				return 0
			}

			let diff: number = attrs[0] - input
			return (-500/(choisesCount * choisesCount)) * (diff * diff)
		}
	}

	function createScoreAdd() {
		return (attrs: number[], input: number): number => {
			// どちらでもよいときは変動なし
			if (input == 2) {
				return 0
			}
			if (attrs[0] === input && input == 0) {
				return 600
			} else {
				return -600
			}
		}
	}

	function createScoreBirth() {
		let now = Math.floor( new Date().getFullYear())
		return (attrs: number[], input: number): number => {
			// 5:どちらでもよいが選ばれたときは全員最高評価
			if (input === 5) {
				return 0
			}

			// 現在 - 登録年
			let rank: number = 0
			let period: number = now - attrs[0]
			if (period > 5) {
				rank = 4
			} else if (period > 4) {
				rank = 3
			} else if (period > 3) {
				rank = 2
			} else if (period > 2) {
				rank = 1
			}
			let diff: number = rank - input
			return (-400/25) * (diff * diff)
		}
	}

	// 結果表示
	function showResults(extra: boolean): VT[] {
		vts.sort((a, b) => b.score - a.score)

		// おかわりボタン押されたら0~11を、デフォルトでは0~4を表示する
		let showidx: number = extra ? 10 : 4

		// 同順位があるときは余分にとって random をかけるのでカウントしておく
		let duplicated: number = 1

		while(vts[showidx].score == vts[showidx+duplicated].score && vts.length > duplicated+4) {
			// 全員同値になるときはout of range前に離脱する
			if (duplicated >= vts.length-1-showidx) {
				break
			}
			duplicated++
		}

		let d:number = Math.floor(Math.random() * duplicated)

		// おかわりボタンを押されたら多く返す
		if (extra) {
			return [vts[0], vts[1], vts[2], vts[3], vts[4], vts[5], vts[6], vts[7], vts[8], vts[9], vts[10+d]]
		}
		return [vts[0], vts[1], vts[2], vts[3], vts[4+d]]
	}

	// ランダムにVTuberを選ぶ
	function randomPickVT(): VT {
		let idx = Math.floor(Math.random() * vts.length)
		return vts[idx]
	}

	// 設題ごとに全員を採点する
	function addScoresByQuestion() {
		vts = vts.map(
			(vt) => {
				// 1問目でスコアリセット
				if (answerCount === 0) {
					vt.score = 0
				}

				// スコアリング
				let filler = [0]
				if (answerCount === 19) {
					// 色データは集めていないので現時点では全員をカラフルと判定する
					filler = [5]
				}
				let calc = questions[answerCount].fun(vt.attrsSet[answerCount] || filler, choises[answerCount])
				vt.score = vt.score + calc

				return vt
			}
		)
	}
	// 設題ごとに全員を減点する(戻るボタン）
	function cancelLastScores() {
		vts = vts.map(
			(vt) => {
				// 1問目でスコアリセット
				if (answerCount === 0) {
					vt.score = 0
				}

				// スコアリング
				let filler = [0]
				if (answerCount === 19) {
					filler = [5]
				}
				let calc = questions[answerCount-1].fun(vt.attrsSet[answerCount-1] || filler, choises[answerCount-1])
				vt.score = vt.score - calc
				return vt
			}
		)
	}

	// 質問20題くらい作る
	const questions: question[] = [
		// 1
		{
			q: "どんな声が好き？",
			as: [
				"渋い",
				"かっこいい",
				"中性的",
				"おしとやか",
				"かわいい",
				"こだわらない",
			],
			fun: createScoreNorm(5),
		},
		// 2
		{
			q: "好きな見た目は?",
			as: [
				"女性",
				"中性的な女性",
				"無性別",
				"中性的な男性",
				"男性",
				"こだわらない",
			],
			fun: createScoreNorm(5),
		},
		// 3
		{
			q:"好きなテンションは？",
			as: [
				"クール",
				"ちょいクール",
				"まちまち",
				"元気",
				"うるさい",
				"こだわらない",
			],
			fun: createScoreNorm(5),
		},
		// 4
		{
			q:"好きなコメント欄の雰囲気は?",
			as: [
				"こじんまり",
				"のんびり",
				"にぎやか",
				"ガヤガヤ",
				"こだわらない",
			],
			fun: createScoreNorm(4)
		},
		// 5
		{
			q: "いつ頃デビュー?",
			as: [
				"今年！",
				"去年",
				"一昨年",
				"もっと前",
				"もっともっと前",
				"こだわらない",
			],
			fun: createScoreBirth(),
		},
		// 6
		{
			q:"チャンネル規模は？",
			as: [
				"駆け出し",
				"小さめ",
				"そこそこ",
				"大きめ",
				"大手",
				"こだわらない",
			],
			fun: createScoreNorm(5),
		},
		// 7
		{
			q:"見たいコンテンツは?",
			as: [
				"歌",       // 0
				"お絵かき", // 1
				"ゲーム",   // 2 
				"雑談",     // 3
				"TRPG",     // 4
				"ホラー",   // 5
				"ASMR",     // 6
				"企画",     // 7
				"学術",     // 8
				"その他",   // 9
				"こだわらない", // 10
			],
			fun: createScoreMatch(10),
		},
		// 8
		{
			q:"トークとリアクションどっちが大事?",
			as: [
				"トーク",
				"リアクション",
				"どちらでもない",
			],
			fun: createScoreNorm(2),
		},
		// 9
		{
			q:"ケモ耳は好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 10
		{
			q:"オッドアイは好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 11
		{
			q:"眼鏡は好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 12
		{
			q:"和服は好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 13
		{
			q:"ロリ・ショタは好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 14
		{
			q:"人外は好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 15
		{
			q:"メカは好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 16
		{
			q:"方言は好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 17
		{
			q:"下ネタは好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 18
		{
			q:"目隠れは好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 19
		{
			q:"お酒飲む人は好き?",
			as: [
				"すき",
				"にがて",
				"どちらでもない",
			],
			fun: createScoreAdd(),
		},
		// 20
		{
			q: "好きな色は?※未実装",
			as: [
				"赤系",
				"青系",
				"緑系",
				"白系",
				"黒系",
				"カラフル",
				"こだわらない",
			],
			fun: createScoreMatch(6),
		}

	]

	const [more, setMore] = useState(false)
	const [choises, setChoises] = useState([
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0,
		0,0,0,0,0
	])

	const [answerCount, setAnswerCount] = useState(-1)
	const [nameFound, setNameFound] = useState(true)
	const [nameFinding, setNameFinding] = useState("")

	// 選択肢記憶
	function handleChoise(a: number): void {
		let nextChoises = choises
		nextChoises[answerCount] = a
		setChoises(nextChoises)

		// 全VT のスコアを更新
	 	addScoresByQuestion()

		setAnswerCount(answerCount + 1)
	}

	function handleBack(): void {
		// 全VT のスコアを更新
		cancelLastScores()

		setAnswerCount(answerCount-1)

		let nextChoises = choises
		nextChoises[answerCount] = 0
		setChoises(nextChoises)

	}

	return (
		<>
		<div className="container p-1">
		<div className="container pl-1 pr-1">
		<a href="/sonorv/">
		<LazyLoadImage src={basePath + "logo.png"} width="320px" alt="logo"/>
		</a>

		{ answerCount == -1 &&
			<div>
		<p className="m-plus-rounded-1c-bold">そのぶいはVリスナーの皆さんの好みを選んでもらうことで</p>
		<p className="m-plus-rounded-1c-bold">好みに合うかもしれない <span className="has-text-info">VTuber</span> をざっくりオススメするサービスです。</p>
		<p className="m-plus-rounded-1c-bold">現在<span className="has-text-danger"> { vts.length } </span>人の<span className="has-text-info"> VTuber</span> が登録中されています。</p>
		<p  className="m-plus-rounded-1c-regular is-size-7">※なるべく希望に合う人を探すけどピッタリの人が出るとは限りません！！</p>
		<p  className="m-plus-rounded-1c-regular is-size-7">※VTuberデータの追加はご本人様から<a href="https://x.com/@miyanoyami83" target="_blank">宮乃やみ</a>までご連絡ください。</p>
		</div>
		}

		{ answerCount == -1 &&
			<div>
		<button className="m-2 button is-primary is-light m-plus-rounded-1c-bold" onClick={() => {
			setAnswerCount(0)
		}
		}>はじめる</button>
			<button className="m-2 button is-danger is-light m-plus-rounded-1c-bold" onClick={() => {
			setAnswerCount(-100)
		}
		}>運に任せるぜ！</button>
		</div>
		}
		{
			answerCount == -1 &&
				<div className="column is-half is-offset-one-quarter">
				<input
					className="input is-small is-info is-rounded"
					placeholder="登録済みの名前を調べる"
				   	type="text"
				   	value={nameFinding}
				   	onChange={(event) =>{
					   	findName(event.target.value)}
					}/>
				</div>
		}
		{
			answerCount == -1 &&
				nameFound &&
				nameFinding !== "" &&
				<p className="is-size-7 m-plus-rounded-1c-bold">いるかも</p>
		}
		{
			answerCount == -1 &&
				!nameFound &&
				<p className="is-size-7 m-plus-rounded-1c-bold">いないかも</p>
		}


		{
			questions.map(
				(question, i) => {
					if (answerCount == i) {
						return (
							<div key={i} className="card fixed-grid m-2">
							<p>【{i+1}問目】</p>
							<p className="is-size-5">{question.q}</p>
							{
								question.as.map(
									(a, j) => {
										let buttonClass = `button is-medium is-fullwidth has-text-weight-medium`;
										return (
											<div key={"sub-" + j} className="cell m-1">
											<button className={buttonClass} onClick={() =>{
												handleChoise(j)
											}
											}>{a}</button>
											</div>
										)}
								)
							}
							</div>
						)
					}
				}
			)

		}

		<div>
		{ answerCount === questions.length && <h2>おすすめのVTuberは......</h2> }
		{ answerCount === questions.length && <p className="is-size-7">※タップするとチャンネルが開きます</p> }
		{ answerCount === questions.length && showResults(false || more).map(vtuber => <VTCard vtuber={vtuber} key={vtuber.name} />) }
		</div>
		<div>
		{ answerCount === questions.length && !more &&
			<button className="m-2 button is-primary is-light m-plus-rounded-1c-bold" onClick={() => setMore(true)}
		>おかわりする</button>
		}
		</div>

		<div>
		{ answerCount === -100 && <h2 className="m-plus-rounded-1c-regular">ランダムに選ばれたVTuberは......</h2>}
		{ answerCount === -100 && <p className="is-size-7 m-plus-rounded-1c-regular">※タップするとチャンネルが開きます</p> }
		{ answerCount === -100 && <VTCard vtuber={randomPickVT()} /> }
		</div>

		<div>
		{ answerCount > 0 &&
			<button className="m-2 button is-info is-light m-plus-rounded-1c-bold" onClick={() => {
			setMore(false)
			handleBack()
		}
		}>前の質問に戻る</button>
		}

		{ (answerCount > 0 || answerCount === -100) &&
			<button className="m-2 button is-warning is-light m-plus-rounded-1c-bold" onClick={() => {
			setChoises([
				0,0,0,0,0,
				0,0,0,0,0,
				0,0,0,0,0,
				0,0,0,0,0,
			])
			setMore(false)
			setAnswerCount(-1)
		}
		}>最初にもどる</button>
		}
		</div>
		</div>
		</div>
		</>
	)
}

export default App
